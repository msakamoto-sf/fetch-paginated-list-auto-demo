package example.demo;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class HtmlController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/shop/{shopId}")
    public String shop(final @PathVariable String shopId, Model m) {
        m.addAttribute("shopId", shopId);
        return "shop_items";
    }

    @GetMapping("/shop2/{shopId}")
    public String shop2(final @PathVariable String shopId, Model m) {
        m.addAttribute("shopId", shopId);
        return "shop_items2";
    }

}
