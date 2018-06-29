
function update_item_table() {
    const shopId = document.f_paginate_param.shopId.value;
    const limit = document.f_paginate_param.limit.value;
    const offset = document.f_paginate_param.offset.value;
    const queries = new URLSearchParams();
    queries.append('limit', limit);
    queries.append('offset', offset);
    const url = '/api/shop/' + shopId + '/items?' + queries;

    fetch(url, {
        /* see:
         * 第2話: Fetch API の雑多なメモ 〜 REAL WORLD HTTP第7章より 〜 - yagisukeのWebなブログ
         * http://yagisuke.hatenadiary.com/entry/2018/01/28/181907
         * 
         * WindowOrWorkerGlobalScope.fetch() - Web APIs | MDN
         * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
         */
        cache: 'no-cache'
    })
      .then(response => {
          if (response.ok) {
              console.log(response.headers.get('last-modified'));
              console.log(response.headers.get('X-Item-All-Count'));
              console.log(response.headers.get('x-item-all-count'));
              return response.json();
          }
          throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
      })
      .then(items => {
          const tbody = document.querySelector('table#items_table tbody');
          while (tbody.lastElementChild) {
              tbody.removeChild(tbody.lastElementChild);
          }
          for(let item of items) {
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
              
              const item_tr = document.createElement('tr');
              item_tr.appendChild(id_td);
              item_tr.appendChild(label_td);
              item_tr.appendChild(price_td);
              item_tr.appendChild(last_updated_at_td);
              item_tr.appendChild(update_td);
              item_tr.appendChild(delete_td);
              tbody.appendChild(item_tr);
          }
      })
      .catch(error => {
          console.log(error);
          alert(error);
      });
    
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
              update_item_table();
              return true;
          }
          throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
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
              update_item_table();
              return true;
          }
          throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
      })
      .catch(error => {
          console.log(error);
          alert(error);
      });
}

function delete_item(itemId) {
    const shopId = document.f_paginate_param.shopId.value;

    fetch('/api/shop/' + shopId + '/item/' + itemId, {
        method: 'DELETE'
      })
      .then(response => {
          if (response.ok) {
              update_item_table();
              return true;
          }
          throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
      })
      .catch(error => {
          console.log(error);
          alert(error);
      });
    
}

update_item_table();