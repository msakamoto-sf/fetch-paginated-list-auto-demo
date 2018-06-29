package example.demo;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.ApplicationScope;

@ApplicationScope
@Component
public class ShopItemRepository {
    protected final Logger log = LoggerFactory.getLogger(ShopItemRepository.class);
    protected final Map<String, Map<Integer, ShopItem>> repo = new LinkedHashMap<>();
    protected final Map<String, LocalDateTime> lastDeletedAtOfEachRepo = new HashMap<>();

    public ShopItemRepository() {
        log.info("shop item repository initalized.");
    }

    public List<String> getShops() {
        return new ArrayList<>(repo.keySet());
    }

    public void generateItems(final String shopId, final int genSize) {
        final Random rand = new Random();
        final Map<Integer, ShopItem> items = new LinkedHashMap<>();
        for (int id = 1; id <= genSize; id++) {
            final ShopItem newItem = new ShopItem();
            newItem.id = id;
            newItem.label = "shop-" + shopId + "-" + id;
            newItem.price = rand.nextInt(1000);
            items.put(id, newItem);
        }
        log.info("{} items registered for shop[{}]", genSize, shopId);
        repo.put(shopId, items);
    }

    public List<ShopItem> getItems(final String shopId) {
        return new ArrayList<>(repo.getOrDefault(shopId, Collections.emptyMap()).values());
    }

    public static class ItemPage {
        public final int count;
        public final int limit;
        public final int offset;
        public final LocalDateTime lastUpdatedAt;
        public final List<ShopItem> items;

        public ItemPage(final int count, final int limit, final int offset, final LocalDateTime lastUpdatedAt,
                final List<ShopItem> items) {
            this.count = count;
            this.limit = limit;
            this.offset = offset;
            this.lastUpdatedAt = lastUpdatedAt;
            this.items = items;
        }
    }

    public ItemPage getItemPage(final String shopId, final int limit, final int offset) {
        List<ShopItem> all = new ArrayList<>(repo.getOrDefault(shopId, Collections.emptyMap()).values());
        final int allSize = all.size();
        final int fromIndex = offset;
        int toIndex = fromIndex + limit;
        if (toIndex > allSize) {
            toIndex = allSize;
        }
        List<ShopItem> paged = all.subList(fromIndex, toIndex);
        paged.get(0).lastUpdatedAt.toInstant(ZoneOffset.UTC).toEpochMilli();
        LocalDateTime maxLastUpdatedAt =
            paged
                .stream()
                .map(it -> it.lastUpdatedAt)
                .max(Comparator.comparingLong((x) -> x.toInstant(ZoneOffset.UTC).toEpochMilli()))
                .get();
        /* 最後に削除が発生した日時 : どの位置で削除されたかまでは見ない。
         * なぜなら、途中で削除が発生した場合、それ以降の全てのoffsetがずれるので、結局全て取り直しになる。
         */
        if (lastDeletedAtOfEachRepo.containsKey(shopId)) {
            final LocalDateTime lastDeletedAt = lastDeletedAtOfEachRepo.get(shopId);
            if (maxLastUpdatedAt.isBefore(lastDeletedAtOfEachRepo.get(shopId))) {
                maxLastUpdatedAt = lastDeletedAt;
            }
        }
        return new ItemPage(allSize, limit, offset, maxLastUpdatedAt, paged);
    }

    public ShopItem getItem(final String shopId, final int itemId) {
        if (!repo.containsKey(shopId)) {
            return null;
        }
        Map<Integer, ShopItem> items = repo.get(shopId);
        return items.getOrDefault(itemId, null);
    }

    public ShopItem updateItem(final String shopId, final int itemId, final String newLabel, final int newPrice) {
        if (!repo.containsKey(shopId)) {
            return null;
        }
        Map<Integer, ShopItem> items = repo.get(shopId);
        if (!items.containsKey(itemId)) {
            return null;
        }
        final ShopItem item = items.get(itemId);
        item.label = newLabel;
        item.price = newPrice;
        item.lastUpdatedAt = LocalDateTime.now();
        return item;
    }

    public ShopItem addItem(final String shopId, final String newLabel, final int newPrice) {
        if (!repo.containsKey(shopId)) {
            return null;
        }
        Map<Integer, ShopItem> items = repo.get(shopId);
        final Optional<Integer> maxId = items.keySet().stream().max(Comparator.naturalOrder());
        final ShopItem newItem = new ShopItem();
        newItem.id = maxId.get() + 1;
        newItem.label = newLabel;
        newItem.price = newPrice;
        items.put(newItem.id, newItem);
        return newItem;
    }

    public ShopItem deleteItem(final String shopId, final int itemId) {
        if (!repo.containsKey(shopId)) {
            return null;
        }
        lastDeletedAtOfEachRepo.put(shopId, LocalDateTime.now());
        Map<Integer, ShopItem> items = repo.get(shopId);
        final ShopItem removed = items.getOrDefault(itemId, null);
        items.remove(itemId);
        return removed;
    }

}
