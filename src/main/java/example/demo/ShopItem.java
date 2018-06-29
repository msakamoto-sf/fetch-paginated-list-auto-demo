package example.demo;

import java.time.LocalDateTime;

public class ShopItem {
    public int id;
    public String label;
    public int price;

    /* see:
     * Java8日付時刻APIの使いづらさと凄さ - きしだのはてな
     * http://d.hatena.ne.jp/nowokay/20130917
     * 
     * Spring-Boot でJava８日時を使うためには - Qiita
     * https://qiita.com/sknx/items/f8e3efb3178a11d53609
     * 
     * Java日付時刻APIメモ(Hishidama's Java8 Date and Time API Memo)
     * http://www.ne.jp/asahi/hishidama/home/tech/java/datetime.html
     * 
     * Java8の日時APIはとりあえずこれだけ覚えとけ - Qiita
     * https://qiita.com/tag1216/items/91a471b33f383981bfaa
     * 
     */
    public LocalDateTime lastUpdatedAt = LocalDateTime.now();
}
