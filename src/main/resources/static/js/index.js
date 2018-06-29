/* see:
 * Fetch API - Web APIs | MDN
 * https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 * 
 * 第2話: Fetch API の雑多なメモ 〜 REAL WORLD HTTP第7章より 〜 - yagisukeのWebなブログ
 * http://yagisuke.hatenadiary.com/entry/2018/01/28/181907
 * 
 * Fetch API で x-www-form-urlencoded を直接指定することを避ける - Qiita
 * https://qiita.com/masakielastic/items/70516e074eadf2ce09dd
 * 
 * fetch API でも POST したい！ - Qiita
 * https://qiita.com/DUxCA/items/801e88462eb5c84af97d
 */

function do_generate() {
    const shopId = document.f_generate.shopId.value;
    const genSize = document.f_generate.genSize.value;
    const formData = new FormData();
    formData.append('genSize', genSize);

    fetch('/api/shop/' + shopId + '/items', {
        method: 'POST',
        body: formData
      })
      .then(response => {
          if (response.ok) {
              return 'shopId[' + shopId + '] ' + genSize + ' items created.';
          }
          throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
      })
      .then(r => {
          alert(r);
          update_shop_list();
      })
      .catch(error => {
          console.log(error);
          alert(error);
      });
}

function update_shop_list() {
    fetch('/api/shop')
      .then(response => {
          if (response.ok) {
              return response.json();
          }
          throw new Error('status=' + response.status + ', reason=[' + response.statusText + ']');
      })
      .then(shopIds => {
          const shopIdUls = document.querySelector('ul#shopid_links');
          while (shopIdUls.lastElementChild) {
              shopIdUls.removeChild(shopIdUls.lastElementChild);
          }
          for(let shopId of shopIds) {
              const alink = document.createElement('a');
              alink.setAttribute('target', '_blank');
              alink.setAttribute('href', '/shop/' + shopId);
              const linklabel = document.createTextNode('/shop/' + shopId);
              alink.appendChild(linklabel);

              const separator1 = document.createTextNode(' - ');

              const alink2 = document.createElement('a');
              alink2.setAttribute('target', '_blank');
              alink2.setAttribute('href', '/shop2/' + shopId);
              const linklabel2 = document.createTextNode('/shop2/' + shopId);
              alink2.appendChild(linklabel2);

              const li = document.createElement('li');
              li.appendChild(alink);
              li.appendChild(separator1);
              li.appendChild(alink2);
              shopIdUls.appendChild(li);
          }
      })
      .catch(error => {
          console.log(error);
          alert(error);
      });
    
}

update_shop_list();