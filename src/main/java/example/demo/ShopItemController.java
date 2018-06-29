package example.demo;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.WebRequest;

import example.demo.ShopItemRepository.ItemPage;

@RestController
@RequestMapping("/api/shop")
public class ShopItemController {

    @Autowired
    ShopItemRepository repo;

    @GetMapping
    public List<String> getShopIds() {
        return repo.getShops();
    }

    @GetMapping("/{shopId}/items")
    public List<ShopItem> getItems(final @PathVariable String shopId,
            final @RequestParam(defaultValue = "100") int limit, final @RequestParam(defaultValue = "0") int offset,
            final HttpServletRequest httpServletRequest, final HttpServletResponse httpServletResponse,
            final WebRequest webRequest) {
        final ItemPage page = repo.getItemPage(shopId, limit, offset);

        httpServletResponse.setIntHeader("X-Item-All-Count", page.count);

        try {
            long ifModifiedSinceEpochMillis = httpServletRequest.getDateHeader("If-Modified-Since");
            System.out.println(ifModifiedSinceEpochMillis);
            if (0 < ifModifiedSinceEpochMillis) {
                final LocalDateTime ifModifiedSinceLdt =
                    LocalDateTime.ofInstant(Instant.ofEpochMilli(ifModifiedSinceEpochMillis), ZoneId.systemDefault());
                System.out.println(ifModifiedSinceLdt);
                System.out.println(page.lastUpdatedAt);
                /* データ側の最終更新日時ではミリ秒まで保持される。
                 * 一方、Last-Modified, If-Modified-Since では秒までしか表現できない。
                 * ここで仮に、ミリ秒を削り落として Last-Modified にセットすると、
                 * Last-Modifiedでは例えば xx分 yy 秒となり、続くブラウザからの If-Last-Modified でも xx 分 yy 秒となる。
                 * そうすると、データ側はミリ秒まで保持しているため、かならず If-Last-Modified < データ側 となってしまう。
                 * この解決には、
                 * 1) Cache時のレスポンス中のLast-Modified側を1秒未来にずらす。
                 * 2) リクエストのIf-Modified-Sinceとデータ側を比較するさいに、データ側のミリ秒以下を削る
                 * の2種類がある。
                 * 
                 * 00m 01s .000
                 * ...
                 * 00m 01s .015 <- data update (a)
                 * ...
                 * 00m 01s .030 <- request occurred with If-Modified-Since
                 * 00m 01s .040 <- resopnse return with Last-Modified
                 * ...
                 * 00m 01s .050 <- data update (b)
                 * ...
                 * 00m 01s .999
                 * 00m 02s .000
                 * 
                 * -> 1) の場合ブラウザ側は (a) までのレスポンスを Last-Modified : 02s と認識する。
                 * その結果、ブラウザが次にリクエストする際は If-Modified-Since: 02s となり、
                 * サーバ側は (b) のデータより後だと認識し、(b) のデータを返さなくなる。
                 * 
                 * -> 2) の場合ブラウザ側は (a) までのレスポンスを Last-Modified : 01s と認識する。
                 * その結果、ブラウザが次にリクエストする際は If-Modified-Since: 01s となり、
                 * サーバ側の比較もミリ秒を削られて 01s となるため、等しいと認識し、この場合もやはり (b) のデータを返さなくなる。
                 * それどころか、厳密なロジック的には (a) のデータもロストしてしまう。
                 * 
                 * 1) の場合、タイミングによってはブラウザが受け取る Last-Modified がブラウザ上のタイムスタンプより未来になる場合もあり得る。
                 * このため、Last-Modifiedの段階でのズレをまず最小に抑えるなら 1) ではなく 2) を採用し、
                 * 実用上は「キャッシュをクリアして取り直す」ようなアプリケーションレベルでの制御を入れるべきだろう。
                 */

                if (ifModifiedSinceLdt.isBefore(page.lastUpdatedAt.truncatedTo(ChronoUnit.SECONDS))) {
                    System.out.println("should be updated");
                } else {
                    System.out.println("not modified.");
                }
            }
        } catch (IllegalArgumentException ignore) {
            // ignore
        }

        if (webRequest.checkNotModified(page.lastUpdatedAt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())) {
            System.err.println("hogehoge");
            return null; // return 304
        } else {
            System.err.println("fugafuga");
        }

        /* see:
         * HTTP キャッシュ - HTTP | MDN
         * https://developer.mozilla.org/ja/docs/Web/HTTP/Caching
         * 
         * ブラウザのキャッシュコントロールを正しく理解する - Qiita
         * https://qiita.com/hkusu/items/d40aa8a70bacd2015dfa
         * 
         * Epoch Converter - Unix Timestamp Converter
         * https://www.epochconverter.com/
         */
        httpServletResponse.setHeader("Cache-Control", "max-age=0");
        httpServletResponse.setDateHeader("Expires", 0);
        httpServletResponse.setDateHeader(
            "Last-Modified",
            page.lastUpdatedAt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        return page.items;
    }

    @PostMapping("/{shopId}/items")
    public void generate(final @PathVariable String shopId, final @RequestParam int genSize) {
        repo.generateItems(shopId, genSize);
    }

    @GetMapping("/{shopId}/item/{itemId}")
    public ShopItem getItem(final @PathVariable String shopId, final @PathVariable int itemId) {
        return repo.getItem(shopId, itemId);
    }

    @PostMapping("/{shopId}/item/{itemId}")
    public ShopItem updateItem(final @PathVariable String shopId, final @PathVariable int itemId,
            final @RequestParam String newLabel, final @RequestParam int newPrice) {
        return repo.updateItem(shopId, itemId, newLabel, newPrice);
    }

    @PutMapping("/{shopId}/item")
    public ShopItem addItem(final @PathVariable String shopId, final @RequestParam String newLabel,
            final @RequestParam int newPrice) {
        return repo.addItem(shopId, newLabel, newPrice);
    }

    @DeleteMapping("/{shopId}/item/{itemId}")
    public ShopItem deleteItem(final @PathVariable String shopId, final @PathVariable int itemId) {
        return repo.deleteItem(shopId, itemId);
    }
}
