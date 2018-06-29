
function clear_item_table() {
    const tbody = document.querySelector('table#items_table tbody');
    while (tbody.lastElementChild) {
        tbody.removeChild(tbody.lastElementChild);
    }
}

function build_item_tr_form(tr_node, item) {
    const id_text = document.createTextNode(item.id);
    const id_td = document.createElement('td');
    id_td.appendChild(id_text);

    const label_input = document.createElement('input');
    label_input.setAttribute('type', 'text');
    label_input.setAttribute('name', 'newLabel-' + item.id);
    label_input.setAttribute('value', item.label);
    label_input.setAttribute('size', '30');

    const label_td = document.createElement('td');
    label_td.appendChild(label_input);

    const price_input = document.createElement('input');
    price_input.setAttribute('type', 'number');
    price_input.setAttribute('name', 'newPrice-' + item.id);
    price_input.setAttribute('value', item.price);

    const price_td = document.createElement('td');
    price_td.appendChild(price_input);

    const last_updated_at_text = document.createTextNode(item.lastUpdatedAt);
    const last_updated_at_td = document.createElement('td');
    last_updated_at_td.appendChild(last_updated_at_text);
    
    const update_button = document.createElement('input');
    update_button.setAttribute('type', 'button');
    update_button.setAttribute('name', 'itemId-' + item.id);
    update_button.setAttribute('value', 'update');
    update_button.setAttribute('onclick', 'update_item("' + item.id + '");');
    const update_td = document.createElement('td');
    update_td.appendChild(update_button);

    const delete_text = document.createTextNode('delete');
    const delete_alink = document.createElement('a');
    delete_alink.setAttribute('href', 'javascript:delete_item(' + item.id + ');');
    delete_alink.appendChild(delete_text);
    const delete_td = document.createElement('td');
    delete_td.appendChild(delete_alink);
    
    tr_node.appendChild(id_td);
    tr_node.appendChild(label_td);
    tr_node.appendChild(price_td);
    tr_node.appendChild(last_updated_at_td);
    tr_node.appendChild(update_td);
    tr_node.appendChild(delete_td);
}

function append_item_table(items) {
    const tbody = document.querySelector('table#items_table tbody');
    for(let item of items) {
        const tr_node = document.createElement('tr');
        build_item_tr_form(tr_node, item);
        tbody.appendChild(tr_node);
    }
}

function add_item() {
    const shopId = document.f_paginate_param.shopId.value;
    const newLabel = document.f_add_item.newLabel.value;
    const newPrice = document.f_add_item.newPrice.value;
    const forms = new URLSearchParams();
    forms.append('newLabel', newLabel);
    forms.append('newPrice', newPrice);

    fetch('/api/shop/' + shopId + '/item', {
        method: 'PUT',
        body: forms
      })
      .then(response => {
          if (response.ok) {
              return response.json();
          }
          throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
      })
      .then(item => {
          append_item_table([item]);
      })
      .catch(error => {
          console.log(error);
          alert(error);
      });
}

function update_item(itemId) {
    const shopId = document.f_paginate_param.shopId.value;
    const newLabel = document.querySelector('input[name="newLabel-' + itemId + '"]').value;
    const newPrice = document.querySelector('input[name="newPrice-' + itemId + '"]').value;
    const forms = new URLSearchParams();
    forms.append('newLabel', newLabel);
    forms.append('newPrice', newPrice);

    fetch('/api/shop/' + shopId + '/item/' + itemId, {
        method: 'POST',
        body: forms
      })
      .then(response => {
          if (response.ok) {
              return response.json();
          }
          throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
      })
      .then(item => {
          update_item_tr(item);
      })
      .catch(error => {
          console.log(error);
          alert(error);
      });
}

function update_item_tr(item) {
    const tbody = document.querySelector('table#items_table tbody');
    if (!tbody.hasChildNodes()) {
        // 更新処理が動いておきながらtbodyが空というのはタイミングレアケース過ぎるので無視
        return;
    }
    const array_of_tr = tbody.childNodes;
    for (const tr_node of array_of_tr) {
        if (tr_node.firstChild.firstChild.textContent != item.id) {
            continue;
        } 
        while (tr_node.lastElementChild) {
            tr_node.removeChild(tr_node.lastElementChild);
        }
        build_item_tr_form(tr_node, item);
    }
}

function delete_item(itemId) {
    const shopId = document.f_paginate_param.shopId.value;

    fetch('/api/shop/' + shopId + '/item/' + itemId, {
        method: 'DELETE'
      })
      .then(response => {
          if (response.ok) {
              // TODO そっか・・・削除するさいはレコード上での最終更新日は変化しないから、304になるか・・・。
              return response.json();
          }
          throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
      })
      .then(item => {
          const tbody = document.querySelector('table#items_table tbody');
          if (!tbody.hasChildNodes()) {
              // 削除処理が動いておきながらtbodyが空というのはタイミングレアケース過ぎるので無視
              return;
          }
          const array_of_tr = tbody.childNodes;
          for (const tr_node of array_of_tr) {
              if (tr_node.firstChild.firstChild.textContent != item.id) {
                  continue;
              }
              tbody.removeChild(tr_node);
          }
      })
      .catch(error => {
          console.log(error);
          alert(error);
      });
    
}

/*
 * ページロード時に100件取ってくる。
 * 全件ヘッダー > 100 なら、「残り全部ロード」ボタンを表示。
 * 
 * 「残り全部ロード」ボタンクリック時:
 * limit=100, offset=100 から取ってくる。
 * 全件ヘッダー - limit(=100) > offset なら、次のoffset=(prev + limit) で取ってくる。
 * 
 * 「キャッシュをクリアしてリロード」ボタンクリック時:
 * limit=100, offset=0 から、分割して全部取り直す、その際 refresh フラグON
 * 
 */

function fetch_items(pagingStatus) {
    const shopId = document.f_paginate_param.shopId.value;
    const f_limit = document.f_paginate_param.limit;
    const f_offset = document.f_paginate_param.offset;
    f_limit.value = pagingStatus.limit;
    f_offset.value = pagingStatus.offset;
    const queries = new URLSearchParams();
    queries.append('limit', pagingStatus.limit);
    queries.append('offset', pagingStatus.offset);
    queries.append('forceRefresh', pagingStatus.forceRefresh);
    const url = '/api/shop/' + shopId + '/items?' + queries;

    fetch(url, {
        cache: 'no-cache'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
        }
        if (response.headers.has('x-item-all-count')) {
            pagingStatus.allSize = parseInt(response.headers.get('x-item-all-count'));
            document.f_paginate_param.all_size.value = pagingStatus.allSize;
        }
        return response.json();
    })
    .then(items => {
        append_item_table(items);
        const load_all_button = document.f_paginate_param.load_all;
        if (pagingStatus.allSize > (pagingStatus.limit + pagingStatus.offset)) {
            load_all_button.disabled = false;
            if (pagingStatus.autoNext) {
                pagingStatus.offset += pagingStatus.limit;
                setTimeout(function() {
                    fetch_items(pagingStatus);
                }, 1000);
            } 
        } else {
            load_all_button.disabled = true;
        }
    })
    .catch(error => {
        console.log(error);
        alert(error);
    });
}

function fetch_next_auto() {
    currPagingStatus.autoNext = true;
    currPagingStatus.offset += currPagingStatus.limit;
    fetch_items(currPagingStatus);
}

const currPagingStatus = {
        allSize: -1,
        limit: 100,
        offset: 0,
        autoNext: false,
        forceRefresh: false
};

fetch_items(currPagingStatus);
