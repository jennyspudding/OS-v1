// Product data for seeding - 8 products per category
const productTemplates = {
  'Pudding Loyang': [
    { name: 'Pudding Loyang Coklat Family', price: 85000, description: 'Pudding coklat premium untuk keluarga dalam loyang 22cm, cocok untuk 8-10 porsi' },
    { name: 'Pudding Loyang Rainbow Layer', price: 95000, description: 'Pudding warna-warni berlapis dalam loyang besar, tampilan menarik untuk acara spesial' },
    { name: 'Pudding Loyang Vanilla Oreo', price: 90000, description: 'Pudding vanilla dengan topping oreo hancur dan whipped cream di loyang 24cm' },
    { name: 'Pudding Loyang Strawberry Delight', price: 88000, description: 'Pudding strawberry segar dengan potongan buah asli dalam loyang persegi' },
    { name: 'Pudding Loyang Pandan Santan', price: 82000, description: 'Pudding pandan tradisional dengan santan kental dalam loyang bulat besar' },
    { name: 'Pudding Loyang Chocolate Fudge', price: 98000, description: 'Pudding coklat premium dengan saus fudge dan almond slice dalam loyang premium' },
    { name: 'Pudding Loyang Mix Fruit', price: 92000, description: 'Pudding dengan campuran buah-buahan segar dalam loyang transparan' },
    { name: 'Pudding Loyang Tiramisu Style', price: 105000, description: 'Pudding ala tiramisu dengan layer coffee dan mascarpone dalam loyang elegan' }
  ],
  'Pudding Tumpeng': [
    { name: 'Pudding Tumpeng Coklat Mini', price: 125000, description: 'Pudding berbentuk tumpeng coklat mini untuk acara ulang tahun dan perayaan' },
    { name: 'Pudding Tumpeng Rainbow Carnival', price: 135000, description: 'Pudding tumpeng warna-warni dengan dekorasi bunga dan pita cantik' },
    { name: 'Pudding Tumpeng Vanilla Gold', price: 145000, description: 'Pudding tumpeng vanilla premium dengan hiasan edible gold dan bunga' },
    { name: 'Pudding Tumpeng Fruit Garden', price: 140000, description: 'Pudding tumpeng dengan dekorasi buah-buahan segar membentuk taman mini' },
    { name: 'Pudding Tumpeng Traditional', price: 120000, description: 'Pudding tumpeng gula jawa dengan hiasan tradisional Indonesia' },
    { name: 'Pudding Tumpeng Chocolate Deluxe', price: 155000, description: 'Pudding tumpeng coklat premium dengan dekorasi mewah untuk acara spesial' },
    { name: 'Pudding Tumpeng Princess Theme', price: 150000, description: 'Pudding tumpeng tema princess dengan dekorasi pink dan glitter food grade' },
    { name: 'Pudding Tumpeng Tropical Paradise', price: 148000, description: 'Pudding tumpeng dengan tema tropical, hiasan kelapa dan buah eksotis' }
  ],
  'Pudding Cup': [
    { name: 'Pudding Cup Coklat Classic', price: 15000, description: 'Pudding coklat dalam cup plastik 200ml, perfect untuk snack harian' },
    { name: 'Pudding Cup Vanilla Bean', price: 14000, description: 'Pudding vanilla dengan biji vanilla asli dalam cup transparan' },
    { name: 'Pudding Cup Strawberry Fresh', price: 16000, description: 'Pudding strawberry dengan potongan buah segar dalam cup lucu' },
    { name: 'Pudding Cup Mango Tango', price: 17000, description: 'Pudding mangga manis dengan daging buah mangga asli Harum Manis' },
    { name: 'Pudding Cup Pandan Coconut', price: 15500, description: 'Pudding pandan dengan kelapa parut segar dalam cup eco-friendly' },
    { name: 'Pudding Cup Oreo Crunch', price: 18000, description: 'Pudding vanilla dengan oreo hancur dan whipped cream topping' },
    { name: 'Pudding Cup Chocolate Mint', price: 16500, description: 'Pudding coklat dengan sentuhan mint segar yang menyejukkan' },
    { name: 'Pudding Cup Mix Berry', price: 19000, description: 'Pudding dengan campuran berry import dalam cup premium' }
  ],
  'Pudding Oriental': [
    { name: 'Pudding Oriental Red Bean', price: 45000, description: 'Pudding kacang merah Jepang dengan tekstur halus dan rasa autentik' },
    { name: 'Pudding Oriental Matcha Supreme', price: 48000, description: 'Pudding green tea matcha premium langsung dari Kyoto dengan bubuk asli' },
    { name: 'Pudding Oriental Black Sesame', price: 42000, description: 'Pudding wijen hitam dengan aroma nutty dan tekstur creamy khas Oriental' },
    { name: 'Pudding Oriental Taro Delight', price: 40000, description: 'Pudding talas ungu dengan rasa earthy dan tampilan purple yang cantik' },
    { name: 'Pudding Oriental Lychee Garden', price: 46000, description: 'Pudding leci dengan buah leci asli dan aroma floral yang menyegarkan' },
    { name: 'Pudding Oriental Coconut Pandan', price: 38000, description: 'Pudding pandan santan dengan sentuhan Oriental dan kelapa muda' },
    { name: 'Pudding Oriental Chrysanthemum', price: 44000, description: 'Pudding bunga krisan dengan rasa floral dan manfaat kesehatan' },
    { name: 'Pudding Oriental Five Spice', price: 50000, description: 'Pudding dengan campuran lima rempah Oriental yang eksotis dan unik' }
  ],
  'Pudding Tart': [
    { name: 'Pudding Tart Chocolate Ganache', price: 65000, description: 'Tart dengan pudding coklat dan ganache premium, base cookie renyah' },
    { name: 'Pudding Tart Lemon Meringue', price: 68000, description: 'Tart pudding lemon dengan meringue panggang dan base pastry butter' },
    { name: 'Pudding Tart Fresh Berry Mix', price: 72000, description: 'Tart pudding vanilla dengan topping berry segar dan glaze mengkilap' },
    { name: 'Pudding Tart Banana Caramel', price: 62000, description: 'Tart pudding pisang dengan saus caramel dan base graham cracker' },
    { name: 'Pudding Tart Coconut Cream', price: 58000, description: 'Tart pudding kelapa dengan parutan kelapa dan base shortbread' },
    { name: 'Pudding Tart Coffee Mocha', price: 70000, description: 'Tart pudding coffee dengan layer mocha dan hiasan coffee bean' },
    { name: 'Pudding Tart Mango Passion', price: 66000, description: 'Tart pudding mangga dengan passion fruit coulis dan base almond' },
    { name: 'Pudding Tart Classic Vanilla', price: 55000, description: 'Tart pudding vanilla klasik dengan vanilla bean dan base butter pastry' }
  ],
  'Pudding Moon': [
    { name: 'Pudding Moon Chocolate Eclipse', price: 75000, description: 'Pudding berbentuk bulan coklat dengan efek eclipse dan edible glitter' },
    { name: 'Pudding Moon Vanilla Crescent', price: 72000, description: 'Pudding vanilla berbentuk bulan sabit dengan hiasan bintang edible' },
    { name: 'Pudding Moon Strawberry Pink', price: 78000, description: 'Pudding strawberry pink berbentuk full moon dengan tekstur lembut' },
    { name: 'Pudding Moon Blue Galaxy', price: 85000, description: 'Pudding blueberry dengan efek galaxy dan shimmer powder food grade' },
    { name: 'Pudding Moon Golden Honey', price: 82000, description: 'Pudding madu emas berbentuk bulan dengan hiasan edible gold' },
    { name: 'Pudding Moon Rainbow Lunar', price: 88000, description: 'Pudding rainbow berbentuk bulan dengan gradasi warna spektrum' },
    { name: 'Pudding Moon Coconut White', price: 70000, description: 'Pudding kelapa putih bersih berbentuk bulan purnama dengan parutan kelapa' },
    { name: 'Pudding Moon Matcha Green', price: 80000, description: 'Pudding matcha hijau berbentuk bulan dengan bubuk matcha premium' }
  ],
  'Pudding 2 Tiers': [
    { name: 'Pudding 2 Tiers Chocolate-Vanilla', price: 155000, description: 'Pudding dua tingkat dengan layer coklat dan vanilla, dekorasi elegant' },
    { name: 'Pudding 2 Tiers Rainbow Celebration', price: 165000, description: 'Pudding dua tingkat warna-warni untuk perayaan dengan pita cantik' },
    { name: 'Pudding 2 Tiers Wedding White', price: 185000, description: 'Pudding dua tingkat putih elegant untuk wedding dengan bunga edible' },
    { name: 'Pudding 2 Tiers Fruit Paradise', price: 175000, description: 'Pudding dua tingkat dengan layer buah-buahan tropis segar' },
    { name: 'Pudding 2 Tiers Coffee Caramel', price: 168000, description: 'Pudding dua tingkat coffee dan caramel dengan hiasan coffee bean' },
    { name: 'Pudding 2 Tiers Princess Pink', price: 172000, description: 'Pudding dua tingkat pink dengan tema princess dan glitter food grade' },
    { name: 'Pudding 2 Tiers Traditional Combo', price: 158000, description: 'Pudding dua tingkat dengan rasa tradisional Indonesia yang autentik' },
    { name: 'Pudding 2 Tiers Premium Gold', price: 195000, description: 'Pudding dua tingkat premium dengan edible gold dan dekorasi mewah' }
  ],
  'Pudding Flower Bouquet': [
    { name: 'Pudding Flower Rose Garden', price: 125000, description: 'Pudding berbentuk buket mawar dengan 12 pudding mini bentuk bunga' },
    { name: 'Pudding Flower Sunflower Bright', price: 118000, description: 'Pudding buket matahari kuning ceria dengan 10 pudding bunga matahari' },
    { name: 'Pudding Flower Lily Elegant', price: 135000, description: 'Pudding buket lily putih elegant dengan 15 pudding bunga lily mini' },
    { name: 'Pudding Flower Tulip Spring', price: 128000, description: 'Pudding buket tulip warna-warni dengan 14 pudding tulip berbagai warna' },
    { name: 'Pudding Flower Orchid Exotic', price: 145000, description: 'Pudding buket anggrek eksotis dengan 12 pudding orchid premium' },
    { name: 'Pudding Flower Cherry Blossom', price: 138000, description: 'Pudding buket sakura pink dengan 16 pudding cherry blossom mini' },
    { name: 'Pudding Flower Daisy Cheerful', price: 115000, description: 'Pudding buket daisy ceria dengan 18 pudding daisy putih-kuning' },
    { name: 'Pudding Flower Mixed Garden', price: 142000, description: 'Pudding buket campuran dengan 20 pudding berbagai jenis bunga' }
  ],
  'Brownie': [
    { name: 'Brownie Fudgy Classic', price: 35000, description: 'Brownie coklat klasik dengan tekstur fudgy dan rich chocolate flavor' },
    { name: 'Brownie Nuts Crunch', price: 38000, description: 'Brownie dengan campuran kacang almond dan walnut untuk extra crunch' },
    { name: 'Brownie Cream Cheese Swirl', price: 42000, description: 'Brownie dengan swirl cream cheese yang creamy dan sedikit tangy' },
    { name: 'Brownie Salted Caramel', price: 45000, description: 'Brownie dengan saus caramel asin yang perfect balance manis-asin' },
    { name: 'Brownie Double Chocolate', price: 40000, description: 'Brownie double coklat dengan chocolate chips dan cocoa powder extra' },
    { name: 'Brownie Peanut Butter', price: 43000, description: 'Brownie dengan selai kacang creamy dan topping peanut butter chips' },
    { name: 'Brownie Red Velvet', price: 46000, description: 'Brownie red velvet dengan cream cheese frosting dan red velvet crumbs' },
    { name: 'Brownie Oreo Blast', price: 41000, description: 'Brownie dengan oreo hancur dan whipped cream topping yang lezat' }
  ]
};

module.exports = { productTemplates }; 