import "./styles.css";
import packageData from "../package.json";
import qrcode from "./vendor/qrcode-generator.js";

const STORAGE_KEY = "librepos:v2";
const CLIENT_ID_KEY = "librepos:client-id";
const PRINTER_STORAGE_KEY = "librepos:printer-name";
const BRAND_IMAGE = "/assets/brand.jpg";
const APP_VERSION = packageData.version || "0.1.0";
const RECEIPT_PRINT_WIDTH = 32;
const DEFAULT_TICKET_MARGIN_MM = 4;
const DEFAULT_TICKET_LOGO_WIDTH_MM = 24;
const DEFAULT_TICKET_LOGO_POSITION = "below-title";
const DEFAULT_IVA_RATE = 0.16;
const RECEIPT_LOGO_MARKER = "__LIBREPOS_LOGO__";
const RECEIPT_BRAND_TITLE = "-- LIBREPOS --";
const RESTAURANT_ADDRESS = "Direccion del restaurante";
const SHARED_STATE_KEYS = [
  "settings",
  "users",
  "orders",
  "sales",
  "cancellations",
  "inventory",
  "ingredientCategories",
  "inventoryMovements",
  "expenses",
  "menuProducts",
  "extraCatalog",
  "attendance",
  "cashSessions",
];

const NON_RECIPE_CATEGORIES = new Set(["EQUIPO", "LIMPIEZA", "DESECHABLES"]);

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const defaultUsers = [
  {
    id: "admin",
    username: "admin",
    password: "admin",
    name: "Administrador",
    role: "Administrador",
    functions: ["admin", "mesero", "cocina", "caja"],
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const userFunctionOptions = [
  { id: "mesero", label: "Mesero" },
  { id: "cocina", label: "Cocina" },
  { id: "caja", label: "Caja" },
  { id: "admin", label: "Admin" },
];

const tables = Array.from({ length: 13 }, (_, index) => index + 1);

const menuCatalog = [
  {
    id: "empanadas-fritas",
    name: "Empanadas fritas",
    section: "Para picar",
    subsection: "Empanadas",
    price: 65,
    station: "Cocina",
    icon: "empanada",
    description: "Orden de 4 piezas.",
    options: [
      singleOption("relleno", "Relleno", ["Queso", "Pollo", "Carne"]),
    ],
  },
  {
    id: "bocoles-maiz",
    name: "Bocoles de maiz",
    section: "Para picar",
    subsection: "Bocoles",
    price: 165,
    station: "Cocina",
    icon: "bowl",
    description: "4 piezas, naturales o masa con frijol.",
    options: [
      singleOption("masa", "Masa", ["Naturales", "Masa con frijol"]),
      singleOption("relleno", "Relleno", [
        "Frijol con chorizo",
        "Huevo revuelto",
        "Queso",
        "Huevo con chorizo",
        "Huevo en salsa verde",
      ]),
    ],
  },
  {
    id: "bocoles-harina",
    name: "Bocoles de harina",
    section: "Para picar",
    subsection: "Bocoles",
    price: 165,
    station: "Cocina",
    icon: "bowl",
    description: "6 piezas acompanadas de frijol, queso y salsa.",
    options: [
      singleOption("proteina", "Proteina", [
        "Cecina",
        "Huevo revuelto",
        "Huevo revuelto con chorizo",
        "Huevo en salsa verde",
        "Carne enchilada",
      ]),
    ],
  },
  {
    id: "tamales",
    name: "Tamales",
    section: "Al vapor",
    subsection: "Tamales",
    price: 45,
    station: "Cocina",
    icon: "steam",
    description: "De hoja de platano estilo Veracruz.",
    options: [
      singleOption("sabor", "Sabor", [
        "Picadillo",
        "Cerdo",
        "Camaron con calabaza",
        "Pique",
        "Queso",
      ]),
    ],
  },
  {
    id: "zacahuil",
    name: "Zacahuil",
    section: "Al vapor",
    subsection: "Tamales",
    price: 95,
    station: "Cocina",
    icon: "steam",
    description: "Tamal gigante de masa martajada, chiles y carne de cerdo.",
    options: [],
  },
  {
    id: "empanadas-harina",
    name: "Empanadas de harina",
    section: "Lo frito",
    subsection: "Empanadas",
    price: 22,
    station: "Cocina",
    icon: "empanada",
    description: "Precio por pieza.",
    options: [singleOption("relleno", "Relleno", ["Manjar", "Carne"])],
  },
  {
    id: "molotes",
    name: "Molotes",
    section: "Lo frito",
    subsection: "Molotes",
    price: 120,
    station: "Cocina",
    icon: "fry",
    description: "4 piezas con repollo, crema y queso.",
    options: [
      singleOption("relleno", "Relleno", ["Pollo", "Carne de cerdo"]),
      singleOption("masa", "Masa", ["Platano", "Papa"]),
    ],
  },
  {
    id: "enchiladas",
    name: "Enchiladas",
    section: "Del comal",
    subsection: "Enchiladas",
    price: 180,
    station: "Cocina",
    icon: "plate",
    description: "4 piezas con frijoles, aguacate y queso asado.",
    options: [
      singleOption("salsa", "Salsa", [
        "Entomatadas",
        "Roja",
        "Verde",
        "Pipian",
        "Cacahuate",
        "Enmoladas",
        "Enfrijoladas",
        "Ajonjoli",
      ]),
      proteinOption(),
    ],
  },
  {
    id: "enchiladas-chile-seco",
    name: "Enchiladas de chile seco",
    section: "Del comal",
    subsection: "Enchiladas",
    price: 240,
    station: "Cocina",
    icon: "plate",
    description: "4 piezas con salsa a eleccion y proteina.",
    options: [
      singleOption("salsa", "Salsa", [
        "Chile seco",
        "Entomatadas",
        "Roja",
        "Verde",
        "Pipian",
        "Enmoladas",
        "Enfrijoladas",
      ]),
      proteinOption(),
    ],
  },
  {
    id: "estrujadas",
    name: "Estrujadas",
    section: "Del comal",
    subsection: "Estrujadas",
    price: 170,
    station: "Cocina",
    icon: "plate",
    description: "Tortilla gruesa, salsa, frijoles, queso y proteina.",
    options: [
      singleOption("salsa", "Salsa", ["Verde", "Roja"]),
      proteinOption(),
    ],
  },
  panProduct("roscas-sin-azucar", "Roscas sin azucar", 20, 60, 120),
  panProduct("roscas-con-azucar", "Roscas con azucar", 20, 60, 120),
  panProduct("pintas", "Pintas", 25, 70, 140),
  panProduct("chichimbre", "Chichimbre", 25, 70, 140),
  panProduct("chancludas", "Chancludas", 20, 70, 140),
  panProduct("envidiosas", "Envidiosas", 25, 70, 140),
  panProduct("pemoles", "Pemoles", 18, 50, 100),
  panProduct("batidas", "Batidas", 70),
  panProduct("doraditas", "Doraditas", 18, 50, 100),
  {
    id: "torrejas",
    name: "Torrejas",
    section: "Lo dulce",
    subsection: "Postres",
    price: 80,
    station: "Cocina",
    icon: "dessert",
    description: "3 piezas con miel de trapiche.",
    options: [
      {
        id: "extras",
        label: "Extras",
        type: "multi",
        required: false,
        choices: [{ label: "Bola de helado de vainilla", priceDelta: 40 }],
      },
    ],
  },
  {
    id: "hojuelas",
    name: "Hojuelas",
    section: "Lo dulce",
    subsection: "Postres",
    price: 65,
    station: "Cocina",
    icon: "dessert",
    description: "5 piezas crujientes con miel de trapiche.",
    options: [],
  },
  {
    id: "platanos-fritos",
    name: "Platanos fritos",
    section: "Lo dulce",
    subsection: "Postres",
    price: 50,
    station: "Cocina",
    icon: "dessert",
    description: "Con crema y queso.",
    options: [],
  },
  drink("cafe-olla", "Cafe de olla", "Calientes", 35, "Canela y piloncillo."),
  drink("atole-dia", "Atole del dia", "Calientes", 40, "Base masa."),
  drink("refresco-escuis", "Refresco Escuis", "Refrescos", 45, "Botella."),
  drink("limonada-jengibre", "Limonada mineral jengibre", "Frias", 65, "Mineral con jengibre."),
  {
    ...drink("limonada-hierbas", "Limonada mineral con hierbas", "Frias", 55, "Hierba buena, albahaca o menta."),
    options: [singleOption("hierba", "Hierba", ["Hierba buena", "Albahaca", "Menta"])],
  },
  drink("frutos-rojos-mango", "Frutos rojos con mango", "Frias", 55, "Bebida fria de casa."),
  drink("pinada", "Pinada", "Frias", 55, "Bebida fria de casa."),
  drink("rusa-topo-chico", "Rusa Topo Chico", "Minerales", 65, "Preparada con Topo Chico."),
  drink("agua-mineral-topo", "Agua mineral Topo Chico", "Minerales", 45, "Botella."),
  drink("agua-dia", "Agua del dia", "Aguas", 35, "Sabor disponible en cocina."),
];

const themes = [
  { id: "tatias", name: "Tatias", brand: "#df835f", strong: "#ba5c3d", soft: "#f7d6c8", teal: "#2f6f73" },
  { id: "verde", name: "Verde", brand: "#5d927b", strong: "#2f6f5a", soft: "#dceee7", teal: "#355f73" },
  { id: "vino", name: "Vino", brand: "#b65a68", strong: "#803343", soft: "#f4d5da", teal: "#3f706b" },
  { id: "maiz", name: "Maiz", brand: "#d8a648", strong: "#9b6e1f", soft: "#f8e6bb", teal: "#386c70" },
];

const inventoryItems = [
  ["CHILES SECOS", "CHILE GUAJILLO", "MERCADO", "KILO", 1, 150, 150],
  ["CHILES SECOS", "CHILE COLOR/ANCHO", "MERCADO", "KILO", 1, 150, 150],
  ["CHILES SECOS", "CHILE CAPON", "MERCADO", "KILO", 0.5, 160, 80],
  ["CHILES SECOS", "CHILE MORITA", "MERCADO", "KILO", 0.5, 120, 60],
  ["CHILES SECOS", "CHILE CANICA", "MERCADO", "KILO", 0.25, 320, 80],
  ["CHILES SECOS", "CHILE TANTOYUQUERO", "MERCADO", "KILO", 0.25, 1000, 250],
  ["CHILES SECOS", "CHILE PIQUIN", "MERCADO", "KILO", 0.25, 1080, 270],
  ["ESPECIAS", "CANELA VARA", "MERCADO", "KILO", 0.25, 500, 125],
  ["ESPECIAS", "CANELA MOLIDA", "MERCADO", "KILO", 0.25, 72, 18],
  ["ESPECIAS", "ANIS ESTRELLA", "MERCADO", "BOLSA", 3, 12, 36],
  ["ESPECIAS", "PIMIENTA", "MERCADO", "KILO", 0.1, 30, 30],
  ["ESPECIAS", "CLAVO", "MERCADO", "KILO", 0.1, 20, 20],
  ["ESPECIAS", "LAUREL", "MERCADO", "KILO", 0.1, 20, 20],
  ["ESPECIAS", "SAL", "OXXO", "KILO", 1, 19.5, 19.5],
  ["ESPECIAS", "COMINO", "MERCADO", "GR", 0.1, 10, 10],
  ["ESPECIAS", "CONSOME", "MERCADO", "KILO", 0.25, 72, 18],
  ["SEMILLAS", "PIPIAN CRIOLLO", "MERCADO", "KILO", 1, 180, 180],
  ["SEMILLAS", "AJONJOLI", "MERCADO", "KILO", 0.5, 100, 25],
  ["SEMILLAS", "CACAHUATE", "MERCADO", "KILO", 1, 70, 70],
  ["HOJAS", "HOJA DE PLATANO", "MERCADO", "ROLLO", 40, 6, 220],
  ["MAIZ", "MASA FINA", "PRODUCTOR", "KILO", 10, 16, 160],
  ["MAIZ", "MASA MERCADO", "MERCADO", "KILO", 8, 25, 200],
  ["MAIZ", "MASA MARTAJADA", "PRODUCTOR", "KILO", 3, 16, 48],
  ["LEGUMBRES", "FRIJOL NEGRO", "MERCADO", "KILO", 5, 35, 175],
  ["PROTEINAS", "CECINA PALOMILLA", "CARNI SAN", "KILO", 1.13, 260, 293.8],
  ["PROTEINAS", "CECINA PULPA NEGRA", "CARNI SAN", "KILO", 5.43, 260, 1411.8],
  ["PROTEINAS", "CHORIZO", "MERCADO", "KILO", 2, 140, 280],
  ["PROTEINAS", "PIERNA DE CERDO", "PROVEEDOR", "KILO", 1, 160, 160],
  ["PROTEINAS", "CARNE ENCHILADA", "PROVEEDOR", "KILO", 3, 140, 420],
  ["PROTEINAS", "POLLO", "MERCADO", "KILO", 1, 150, 150],
  ["PROTEINAS", "HUEVO", "MERCADO", "KILO", 1, 30, 30],
  ["PROTEINAS", "CAMARON", "MERCADO", "KILO", 1, 220, 220],
  ["LACTEOS", "QUESO FRESCO DE ARO", "PRODUCTOR", "PZ", 20, 50, 1000],
  ["LACTEOS", "CREMA", "JAMONERIA", "KG", 0.4, 100, 40],
  ["LACTEOS", "LECHE ENTERA", "SAN JUAN", "LITRO", 0, 0, 0],
  ["LACTEOS", "LECHE DESLACTOSADA", "SAN JUAN", "LITRO", 1, 34, 34],
  ["LACTEOS", "LECHE ALMENDRAS", "Sin proveedor", "LITRO", 0, 0, 0],
  ["LACTEOS", "LECHE COCO", "Sin proveedor", "LITRO", 0, 0, 0],
  ["LACTEOS", "LECHE AVENA", "Sin proveedor", "LITRO", 0, 0, 0],
  ["LACTEOS", "LECHE EVAPORADA", "Sin proveedor", "GR", 0, 0, 0],
  ["LACTEOS", "LECHE CONDENSADA", "Sin proveedor", "GR", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "PLATANO DE CASTILLA", "MERCADO", "KILO", 6, 20, 120],
  ["FRUTAS Y VERDURAS", "PAPA", "MERCADO", "KILO", 5, 24, 120],
  ["FRUTAS Y VERDURAS", "CALABAZA", "MERCADO", "KILO", 2, 30, 60],
  ["FRUTAS Y VERDURAS", "NARANJA DE CUCHO", "MERCADO", "PIEZA", 10, 5, 50],
  ["FRUTAS Y VERDURAS", "PULPA MARACUYA", "Sin proveedor", "KILO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "PULPA TAMARINDO", "Sin proveedor", "KILO", 3, 50, 150],
  ["FRUTAS Y VERDURAS", "PULPA DE JOBO", "PRODUCTOR", "KILO", 2, 80, 160],
  ["FRUTAS Y VERDURAS", "JAMAICA", "MERCADO", "KILO", 1, 105, 105],
  ["FRUTAS Y VERDURAS", "JITOMATE", "MERCADO", "KILO", 1, 33, 33],
  ["FRUTAS Y VERDURAS", "CEBOLLA", "MERCADO", "KILO", 1, 17, 17],
  ["FRUTAS Y VERDURAS", "AJO", "MERCADO", "KILO", 1, 70, 70],
  ["FRUTAS Y VERDURAS", "CHICHARO", "PROVEEDOR", "KILO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "ZANAHORIA", "PROVEEDOR", "KILO", 1, 16, 16],
  ["FRUTAS Y VERDURAS", "REPOLLO", "MERCADO", "PZ", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "CHILE SERRANO", "MERCADO", "KILO", 1, 88, 88],
  ["FRUTAS Y VERDURAS", "MANGO", "Sin proveedor", "KILO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "FRESA", "Sin proveedor", "KILO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "ZARZAMORA", "Sin proveedor", "KILO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "FRAMBUESA", "Sin proveedor", "KILO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "LIMON", "Sin proveedor", "KILO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "HIERBA BUENA", "Sin proveedor", "MANOJO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "ALBAHACA", "Sin proveedor", "MANOJO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "JENGIBRE", "Sin proveedor", "KILO", 0, 0, 0],
  ["FRUTAS Y VERDURAS", "PIÑA", "Sin proveedor", "KILO", 0, 0, 0],
  ["ENDULZANTES", "AZUCAR", "Sin proveedor", "KILO", 0, 0, 0],
  ["ENDULZANTES", "PILONCILLO", "MOLIENDA", "PIEZA", 15, 100, 1500],
  ["ENDULZANTES", "MIEL DE TRAPICHE", "MOLIENDA", "LITRO", 2, 80, 160],
  ["LEGUMBRES", "FRIJOL VAINA", "MERCADO", "ROLLO", 2, 50, 100],
  ["LEGUMBRES", "FRIJOL SECO", "MERCADO", "KILO", 1, 28, 28],
  ["JARABES", "JARABE NATURAL", "Sin proveedor", "ML", 0, 0, 0],
  ["JARABES", "VAINILLA", "MERCADO", "ML", 125, 60.34, 60.34],
  ["JARABES", "JARABE GRANADINA", "Sin proveedor", "ML", 0, 0, 0],
  ["JUGOS", "JUGO DE PIÑA", "Sin proveedor", "LITRO", 0, 0, 0],
  ["JUGOS", "CREMA DE COCO", "Sin proveedor", "LITRO", 0, 0, 0],
  ["VARIOS", "CAFE EN GRANO MOLIDO", "CAFE LA NORIA", "KG", 2, 290, 580],
  ["VARIOS", "MANTECA VEGETAL", "MERCADO", "KG", 0.5, 80, 40],
  ["VARIOS", "MANTECA", "CARNICERIA", "KILO", 6, 60, 360],
  ["VARIOS", "CHOCOLATE DE MESA", "Sin proveedor", "PZ", 0, 0, 0],
  ["VARIOS", "ACEITE", "OXXO", "LITRO", 0.8, 29.9, 29.9],
  ["VARIOS", "HARINA DE TRIGO", "MERCADO", "KG", 1, 22, 22],
  ["VARIOS", "MASECA", "OXXO", "KG", 1, 24.5, 24.5],
  ["VARIOS", "MAIZENA", "Sin proveedor", "KG", 0, 0, 0],
  ["REFRESCOS", "AGUA MINERAL 2 LT", "Sin proveedor", "PZ", 0, 0, 0],
  ["REFRESCOS", "AGUA MINERAL TOPO CHICO BOTELLA DE VIDRIO", "Sin proveedor", "PZ", 0, 0, 0],
  ["REFRESCOS", "AGUA GARRAFON", "OXXO", "LITRO", 60, 3.3, 198],
  ["REFRESCOS", "ESCUIS VARIOS SABORES", "Sin proveedor", "PZ", 0, 0, 0],
  ["DESECHABLES", "SERVILETAS", "COSTCO", "PZ", 1040, 0.22525, 234.26],
  ["DESECHABLES", "VITAFILM", "COSTCO", "PZ", 1, 377.47, 377.47],
  ["DESECHABLES", "BOLSAS ZIPLOC", "COSTCO", "PZ", 4, 91.81, 367.24],
  ["EQUIPO", "ESCALERA", "COSTCO", "PZ", 1, 715.05, 715.05],
  ["EQUIPO", "LICUADORA NINJA", "COSTCO", "PZ", 1, 4397.86, 4397.86],
  ["EQUIPO", "CAJAS PLASTICO", "COSTCO", "PZ", 6, 62.91166666666667, 377.47],
  ["LIMPIEZA", "JABON", "COSTCO", "LT", 2.8, 65.39, 183.09],
  ["LIMPIEZA", "JABON POLVO", "COSTCO", "KG", 10, 29.562, 295.62],
  ["LIMPIEZA", "MICRODYN", "COSTCO", "LITRO", 1, 162.64, 162.64],
  ["SUBRECETAS", "MASA HARINA", "COSTEO RECETAS", "KG", 0, 42.99, 0],
  ["SUBRECETAS", "RELLENO PIERNA", "COSTEO RECETAS", "KG", 0, 193.24, 0],
  ["SUBRECETAS", "RELLENO POLLO", "COSTEO RECETAS", "KG", 0, 200.89, 0],
  ["SUBRECETAS", "RELLENO CARNE", "COSTEO RECETAS", "KG", 0, 193.24, 0],
  ["SUBRECETAS", "MANJAR", "COSTEO RECETAS", "KG", 0, 55.3, 0],
  ["SUBRECETAS", "MASA TAMALES", "COSTEO RECETAS", "KG", 0, 30.81, 0],
  ["SUBRECETAS", "PICADILLO", "COSTEO RECETAS", "KG", 0, 119.11, 0],
  ["SUBRECETAS", "ADOBO", "COSTEO RECETAS", "KG", 0, 54.97, 0],
  ["SUBRECETAS", "MASA MOLOTES PLATANO", "COSTEO RECETAS", "KG", 0, 28.61, 0],
  ["SUBRECETAS", "MASA MOLOTES", "COSTEO RECETAS", "KG", 0, 29.56, 0],
  ["SUBRECETAS", "SALSA MOLOTES", "COSTEO RECETAS", "LITRO", 0, 45.34, 0],
  ["SUBRECETAS", "SALSA PIPIAN", "COSTEO RECETAS", "KG", 0, 45.14, 0],
  ["SUBRECETAS", "SALSA ROJA", "COSTEO RECETAS", "KG", 0, 32.19, 0],
  ["SUBRECETAS", "SALSA VERDE SOFRITA", "COSTEO RECETAS", "KG", 0, 45.14, 0],
  ["SUBRECETAS", "FRIJOLES", "COSTEO RECETAS", "KG", 0, 15.85, 0],
  ["FRUTAS Y VERDURAS", "AGUACATE", "Sin proveedor", "KG", 0, 58.46, 0],
  ["PAN", "ROSCAS SIN AZUCAR", "PANADERIA", "PIEZA", 100, 7, 700],
  ["PAN", "ROSCAS CON AZUCAR", "PANADERIA", "PIEZA", 100, 7, 700],
  ["PAN", "PINTAS", "PANADERIA", "PIEZA", 60, 7, 420],
  ["PAN", "CHICHIMBRE", "PANADERIA", "PIEZA", 20, 7, 140],
  ["PAN", "CHANCLUDAS", "PANADERIA", "PIEZA", 70, 7, 490],
  ["PAN", "ENVIDIOSAS", "PANADERIA", "PIEZA", 30, 7, 210],
  ["PAN", "PEMOLES", "PANADERIA", "PIEZA", 100, 5, 500],
  ["PAN", "BATIDAS", "PANADERIA", "PIEZA", 20, 19, 380],
  ["PAN", "DORADITAS", "PANADERIA", "PIEZA", 96, 7, 672],
  ["PAN", "PAN BAGUETTE", "PANADERIA", "PZ", 0, 15, 0],
  ["VENTA DIRECTA", "REFRESCO ESCUIS", "VENTA DIRECTA", "PZ", 0, 14.4, 0],
  ["VENTA DIRECTA", "LIMONADA MINERAL JENGIBRE", "VENTA DIRECTA", "PZ", 0, 20.8, 0],
  ["VENTA DIRECTA", "LIMONADA MINERAL CON HIERBAS", "VENTA DIRECTA", "PZ", 0, 17.6, 0],
  ["VENTA DIRECTA", "FRUTOS ROJOS CON MANGO", "VENTA DIRECTA", "PZ", 0, 17.6, 0],
  ["VENTA DIRECTA", "PINADA", "VENTA DIRECTA", "PZ", 0, 17.6, 0],
  ["VENTA DIRECTA", "RUSA TOPO CHICO", "VENTA DIRECTA", "PZ", 0, 20.8, 0],
  ["VENTA DIRECTA", "AGUA MINERAL TOPO CHICO", "VENTA DIRECTA", "PZ", 0, 14.4, 0],
  ["VENTA DIRECTA", "AGUA DEL DIA", "VENTA DIRECTA", "PZ", 0, 11.2, 0],
].map(([category, name, supplier, unit, qty, unitCost, totalCost]) => ({
  category,
  name,
  supplier,
  unit,
  qty,
  unitCost,
  totalCost,
}));

const recipeCosts = {
  "atole-dia": 4.71,
  "cafe-olla": 9.15,
  zacahuil: 23.37,
  "bocoles-maiz": 39.57,
  "bocoles-harina": 44.73,
  tamales: 9.75,
  "empanadas-fritas": 5.99,
  "empanadas-harina": 5.49,
  molotes: 23.07,
  enchiladas: 47.24,
  "enchiladas-chile-seco": 67.33,
  estrujadas: 15.07,
  torrejas: 14.97,
  hojuelas: 8.87,
  "platanos-fritos": 11,
  "roscas-sin-azucar": 7,
  "roscas-con-azucar": 7,
  pintas: 7,
  chichimbre: 7,
  chancludas: 7,
  envidiosas: 7,
  pemoles: 5,
  batidas: 19,
  doraditas: 7,
};

const fixedExpenses = [
  { id: "fixed-insumos-pan", name: "Gasto insumos y pan", supplier: "Varios", category: "Insumos", amount: 17241.54 },
  { id: "fixed-pan-registrado", name: "Gasto pan registrado", supplier: "Panaderia", category: "Pan", amount: 4212 },
];

const inventoryRecipes = {
  "empanadas-fritas": [
    { name: "MASA MERCADO", qty: 0.35 },
    { name: "QUESO FRESCO DE ARO", qty: 0.04 },
  ],
  "bocoles-maiz": [
    { name: "MASA MERCADO", qty: 0.16 },
    { name: "CECINA PALOMILLA", qty: 0.12 },
    { name: "QUESO FRESCO DE ARO", qty: 0.01 },
  ],
  "bocoles-harina": [
    { name: "MASA MERCADO", qty: 0.25 },
    { name: "CECINA PALOMILLA", qty: 0.12 },
    { name: "QUESO FRESCO DE ARO", qty: 0.005 },
  ],
  tamales: [
    { name: "MASA MERCADO", qty: 0.054 },
    { name: "HOJA DE PLATANO", qty: 0.08 },
    { name: "PIERNA DE CERDO", qty: 0.04 },
  ],
  zacahuil: [
    { name: "MASA MARTAJADA", qty: 0.14 },
    { name: "PIERNA DE CERDO", qty: 0.09 },
    { name: "HOJA DE PLATANO", qty: 0.1 },
  ],
  "empanadas-harina": [
    { name: "MASA HARINA", qty: 0.05 },
    { name: "MANJAR", qty: 0.05 },
    { name: "AZUCAR", qty: 0.000667 },
    { name: "CANELA MOLIDA", qty: 0.000333 },
  ],
  molotes: [
    { name: "MASA MERCADO", qty: 0.14 },
    { name: "POLLO", qty: 0.1 },
    { name: "CREMA", qty: 0.001 },
    { name: "QUESO FRESCO DE ARO", qty: 0.02 },
  ],
  enchiladas: [
    { name: "MASA MERCADO", qty: 0.16 },
    { name: "CECINA PALOMILLA", qty: 0.12 },
    { name: "QUESO FRESCO DE ARO", qty: 0.02 },
    { name: "JITOMATE", qty: 0.1 },
  ],
  "enchiladas-chile-seco": [
    { name: "MASA MERCADO", qty: 0.16 },
    { name: "CHILE GUAJILLO", qty: 0.08 },
    { name: "CECINA PALOMILLA", qty: 0.12 },
    { name: "QUESO FRESCO DE ARO", qty: 0.02 },
  ],
  estrujadas: [
    { name: "MASA MERCADO", qty: 0.2 },
    { name: "CECINA PALOMILLA", qty: 0.12 },
    { name: "QUESO FRESCO DE ARO", qty: 0.02 },
  ],
  torrejas: [
    { name: "PAN BAGUETTE", qty: 0.6 },
    { name: "HUEVO", qty: 0.042 },
    { name: "CANELA MOLIDA", qty: 0.001 },
    { name: "VAINILLA", qty: 0.001 },
    { name: "MIEL DE TRAPICHE", qty: 0.052 },
  ],
  hojuelas: [
    { name: "MASA HARINA", qty: 0.1 },
    { name: "MIEL DE TRAPICHE", qty: 0.07 },
  ],
  "platanos-fritos": [
    { name: "PLATANO DE CASTILLA", qty: 0.18 },
    { name: "CREMA", qty: 0.07 },
    { name: "QUESO FRESCO DE ARO", qty: 0.008 },
  ],
  "cafe-olla": [
    { name: "AGUA GARRAFON", qty: 0.333 },
    { name: "ANIS ESTRELLA", qty: 0.044 },
    { name: "CANELA VARA", qty: 0.003 },
    { name: "CLAVO", qty: 0.0001 },
    { name: "CAFE EN GRANO MOLIDO", qty: 0.017 },
    { name: "PILONCILLO", qty: 0.017 },
  ],
  "atole-dia": [
    { name: "AGUA GARRAFON", qty: 0.4 },
    { name: "MASA MERCADO", qty: 0.04 },
    { name: "CANELA VARA", qty: 0.003 },
    { name: "PILONCILLO", qty: 0.025 },
  ],
  "refresco-escuis": [
    { name: "REFRESCO ESCUIS", qty: 1 },
  ],
  "limonada-jengibre": [
    { name: "LIMONADA MINERAL JENGIBRE", qty: 1 },
  ],
  "limonada-hierbas": [
    { name: "LIMONADA MINERAL CON HIERBAS", qty: 1 },
  ],
  "frutos-rojos-mango": [
    { name: "FRUTOS ROJOS CON MANGO", qty: 1 },
  ],
  pinada: [
    { name: "PINADA", qty: 1 },
  ],
  "rusa-topo-chico": [
    { name: "RUSA TOPO CHICO", qty: 1 },
  ],
  "agua-mineral-topo": [
    { name: "AGUA MINERAL TOPO CHICO", qty: 1 },
  ],
  "agua-dia": [
    { name: "AGUA DEL DIA", qty: 1 },
  ],
};

const icons = {
  sale: `<path d="M4 6h16v12H4z" /><path d="M8 10h8M8 14h5" />`,
  tables: `<path d="M4 9h16" /><path d="M6 9l-2 10M18 9l2 10" /><path d="M8 9V5h8v4" />`,
  kitchen: `<path d="M4 10h16" /><path d="M6 10v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" /><path d="M8 6h8" /><path d="M10 3h4" />`,
  inventory: `<path d="M4 7 12 3l8 4-8 4Z" /><path d="M4 7v10l8 4 8-4V7" /><path d="M12 11v10" />`,
  data: `<path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-8" />`,
  users: `<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.8" /><path d="M16 3.1a4 4 0 0 1 0 7.8" />`,
  logout: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />`,
  search: `<circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" />`,
  plus: `<path d="M12 5v14M5 12h14" />`,
  minus: `<path d="M5 12h14" />`,
  trash: `<path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M7 7l1 13h8l1-13" />`,
  table: `<path d="M4 9h16" /><path d="M6 9l-2 10M18 9l2 10" /><path d="M8 9V5h8v4" />`,
  bag: `<path d="M6 8h12l-1 13H7Z" /><path d="M9 8a3 3 0 0 1 6 0" />`,
  check: `<path d="M20 6 9 17l-5-5" />`,
  clock: `<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />`,
  cash: `<path d="M4 7h16v10H4z" /><circle cx="12" cy="12" r="3" /><path d="M7 9v.01M17 15v.01" />`,
  card: `<path d="M3 6h18v12H3z" /><path d="M3 10h18" /><path d="M7 15h4" />`,
  transfer: `<path d="M7 7h11l-3-3" /><path d="M17 17H6l3 3" />`,
  chevronLeft: `<path d="m15 18-6-6 6-6" />`,
  chevronRight: `<path d="m9 18 6-6-6-6" />`,
  note: `<path d="M5 4h10l4 4v12H5z" /><path d="M15 4v5h5" /><path d="M8 13h8M8 17h6" />`,
  alert: `<path d="M12 3 2.8 19h18.4Z" /><path d="M12 8v5" /><path d="M12 16.5v.01" />`,
  cancel: `<circle cx="12" cy="12" r="9" /><path d="M8 8l8 8M16 8l-8 8" />`,
  print: `<path d="M7 8V4h10v4" /><path d="M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" /><path d="M7 14h10v6H7z" />`,
  settings: `<path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" /><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.1 2.1 0 0 1-2.97 2.97l-.04-.04a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.08 1.65V21a2.1 2.1 0 0 1-4.2 0v-.06a1.8 1.8 0 0 0-1.08-1.65 1.8 1.8 0 0 0-1.98.36l-.04.04a2.1 2.1 0 1 1-2.97-2.97l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.65-1.08H3a2.1 2.1 0 0 1 0-4.2h.06A1.8 1.8 0 0 0 4.71 8.64a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2.1 2.1 0 1 1 2.97-2.97l.04.04a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 10.38 2.4V2.1a2.1 2.1 0 0 1 4.2 0v.06a1.8 1.8 0 0 0 1.08 1.65 1.8 1.8 0 0 0 1.98-.36l.04-.04a2.1 2.1 0 1 1 2.97 2.97l-.04.04a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.65 1.08H22a2.1 2.1 0 0 1 0 4.2h-.06A1.8 1.8 0 0 0 19.4 15Z" />`,
  digital: `<path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" />`,
  empanada: `<path d="M4 15a8 8 0 0 1 16 0v3H4z" /><path d="M8 15v3M12 12v6M16 15v3" />`,
  bowl: `<path d="M5 11h14c-.4 5-3 8-7 8s-6.6-3-7-8Z" /><path d="M7 8c1.5-1.5 8.5-1.5 10 0" />`,
  steam: `<path d="M8 4c2 2-2 3 0 5M12 4c2 2-2 3 0 5M16 4c2 2-2 3 0 5" /><path d="M5 13h14l-2 7H7Z" />`,
  fry: `<path d="M5 12h14l-2 8H7Z" /><path d="M7 9h10" /><path d="M9 5h6" />`,
  plate: `<circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" />`,
  dessert: `<path d="M6 10h12l-2 9H8Z" /><path d="M8 10c0-3 8-3 8 0" /><path d="M12 3v4" />`,
  cup: `<path d="M7 4h10l-1 16H8Z" /><path d="M8 8h8" />`,
};

const defaultState = {
  sessionUserId: null,
  authError: "",
  view: "sale",
  navPage: 0,
  configTab: "general",
  printingTab: "tickets",
  activeOrderId: null,
  activeSection: "Para picar",
  activeSubsection: "Todos",
  productSearch: "",
  recipesMode: "products",
  recipesSection: "",
  recipesSubsection: "Todos",
  recipesSearch: "",
  ingredientsCategory: "Todos",
  ingredientsCategoryScroll: 0,
  ingredientsCategorySearch: "",
  ingredientsSearch: "",
  extrasSearch: "",
  dataOrderSearch: "",
  dataOrderFrom: "",
  dataOrderTo: "",
  dataOrderStatus: "all",
  productConfig: null,
  modal: null,
  paymentMethod: "Efectivo",
  updateInfo: null,
  updateBusy: false,
  settings: {
    restaurantName: "LibrePOS",
    subtitle: "POS restaurante",
    theme: "tatias",
    ticketPrinterName: "",
    commandPrinterName: "",
    commandAutoPrint: false,
    ticketMarginMm: DEFAULT_TICKET_MARGIN_MM,
    ticketMarginLeftMm: DEFAULT_TICKET_MARGIN_MM,
    ticketMarginRightMm: DEFAULT_TICKET_MARGIN_MM,
    ticketLogoDataUrl: "",
    ticketLogoWidthMm: DEFAULT_TICKET_LOGO_WIDTH_MM,
    ticketLogoEnabled: false,
    ticketLogoPosition: DEFAULT_TICKET_LOGO_POSITION,
    ivaEnabled: false,
    ivaRate: DEFAULT_IVA_RATE,
    ivaBasePriceConversionAppliedAt: "",
    ivaBasePriceConversionRate: 0,
    ivaBasePriceConversionCount: 0,
  },
  users: defaultUsers,
  orders: [],
  sales: [],
  cancellations: [],
  inventory: inventoryItems,
  ingredientCategories: [],
  inventoryMovements: [],
  expenses: fixedExpenses,
  menuProducts: [],
  extraCatalog: [],
  attendance: [],
  cashSessions: [],
};

let state = loadState();
const storedTicketPrinterName = loadPrinterName();
if (!state.settings.ticketPrinterName && storedTicketPrinterName) {
  state.settings = { ...state.settings, ticketPrinterName: storedTicketPrinterName };
}
let toastTimer;
let celebrationTimer;
let lockedScrollY = 0;
let openTableSubmitLocked = false;
let syncEnabled = false;
let syncVersion = 0;
let syncClientId = loadClientId();
let syncPushTimer;
let syncLastPayload = "";
let accessInfo = { preferredUrl: "", urls: [] };
let printerRuntime = {
  loaded: false,
  loading: false,
  printing: false,
  legacyPrinting: false,
  fakeReceiptLoading: false,
  fakeReceiptPrinting: false,
  headerPrinting: false,
  logoPrinting: false,
  removing: false,
  printers: [],
  selectedName: loadPrinterName(),
  manualName: "",
  manualCommandName: "",
  error: "",
  lastPrintedAt: "",
  commandPrinting: false,
  commandLastPrintedAt: "",
  commandPreviewText: "",
  fakeReceiptText: "",
  fakeReceiptType: "prepaid",
};
let postpaidTicketPrinting = false;

const app = document.querySelector("#app");

function singleOption(id, label, choices) {
  return {
    id,
    label,
    type: "single",
    required: true,
    choices: choices.map((choice) => (typeof choice === "string" ? { label: choice } : { ...choice })),
  };
}

function proteinOption() {
  return singleOption("proteina", "Proteina", [
    "Cecina",
    "Carne enchilada",
    "Huevo revuelto con chorizo",
    "Huevo en salsa verde",
  ]);
}

function panProduct(id, name, unit, pack5, pack10) {
  const choices = [{ label: "Pieza", price: unit }];
  if (pack5) choices.push({ label: "Paquete 5", price: pack5 });
  if (pack10) choices.push({ label: "Paquete 10", price: pack10 });
  return {
    id,
    name,
    section: "Lo dulce",
    subsection: "Pan de lena",
    price: unit,
    station: "Caja",
    icon: "dessert",
    description: "Pan de la region de horno de lena con base masa madre.",
    options: [
      {
        id: "presentacion",
        label: "Presentacion",
        type: "single",
        required: true,
        choices,
      },
    ],
  };
}

function drink(id, name, subsection, price, description) {
  return {
    id,
    name,
    section: "Bebidas",
    subsection,
    price,
    station: "Barra",
    icon: "cup",
    description,
    options: [],
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    const inventory = normalizeInventory(saved.inventory);
    return {
      ...structuredClone(defaultState),
      ...saved,
      settings: { ...defaultState.settings, ...saved.settings },
      users: normalizeUsers(saved.users),
      orders: Array.isArray(saved.orders) ? saved.orders : [],
      sales: Array.isArray(saved.sales) ? saved.sales : [],
      cancellations: Array.isArray(saved.cancellations) ? saved.cancellations : [],
      updateBusy: false,
      inventory,
      ingredientCategories: normalizeIngredientCategories(saved.ingredientCategories, inventory),
      inventoryMovements: Array.isArray(saved.inventoryMovements) ? saved.inventoryMovements : [],
      expenses: normalizeExpenses(saved.expenses),
      menuProducts: normalizeMenuProducts(saved.menuProducts),
      extraCatalog: normalizeExtraCatalog(saved.extraCatalog, inventory),
      attendance: Array.isArray(saved.attendance) ? saved.attendance : [],
      cashSessions: normalizeCashSessions(saved.cashSessions),
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function safeId(prefix) {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return `${prefix}-${randomUuid}`;
  const fallback = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${fallback}`;
}

function localTimestampParts(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ];
}

function existingPaymentUids() {
  const values = [
    ...(Array.isArray(state.sales) ? state.sales : []),
    ...(Array.isArray(state.orders) ? state.orders : []),
  ];
  return new Set(
    values
      .flatMap((record) => [record.uid, record.paymentUid, record.payment?.uid])
      .filter(Boolean)
      .map(String),
  );
}

function createPaymentUid(date = new Date()) {
  const stem = localTimestampParts(date).join("");
  const used = existingPaymentUids();
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const uid = `${stem}${String(suffix).padStart(2, "0")}`;
    if (!used.has(uid)) return uid;
  }
  return `${stem}${String(Date.now() % 100).padStart(2, "0")}`;
}

function paymentUidForSale(sale) {
  return String(sale?.uid || sale?.paymentUid || sale?.payment?.uid || "");
}

function orderNumberValue(record) {
  const value = record?.orderNumber;
  if (value === undefined || value === null || value === "") return "";
  return String(value).trim();
}

function orderNumberLabel(record, fallback = "-") {
  return orderNumberValue(record) || fallback;
}

function numericOrderNumber(value) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) return 0;
  return Number(text) || 0;
}

function nextOrderNumber() {
  const records = [
    ...(Array.isArray(state.orders) ? state.orders : []),
    ...(Array.isArray(state.sales) ? state.sales : []),
  ];
  const max = records.reduce((current, record) => Math.max(current, numericOrderNumber(record?.orderNumber)), 0);
  return max + 1;
}

function orderDailyDateValue(record, fallback = new Date().toISOString()) {
  return record?.openedAt || record?.createdAt || record?.closedAt || fallback;
}

function orderIdentityKey(record) {
  return record?.orderId || record?.id || `${localDateKey(orderDailyDateValue(record))}:${orderNumberValue(record)}`;
}

function dailyOrderRecords(dateValue = new Date().toISOString()) {
  const dateKey = localDateKey(dateValue);
  const seen = new Set();
  return [
    ...(Array.isArray(state.orders) ? state.orders : []),
    ...(Array.isArray(state.sales) ? state.sales : []),
  ]
    .filter((record) => localDateKey(orderDailyDateValue(record, dateValue)) === dateKey)
    .filter((record) => {
      const key = orderIdentityKey(record);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const timeDiff = new Date(orderDailyDateValue(a, dateValue)) - new Date(orderDailyDateValue(b, dateValue));
      if (timeDiff) return timeDiff;
      return numericOrderNumber(a?.orderNumber) - numericOrderNumber(b?.orderNumber);
    });
}

function nextDailyOrderNumber(dateValue = new Date().toISOString()) {
  const records = dailyOrderRecords(dateValue);
  const maxStored = records.reduce((current, record) => Math.max(current, numericOrderNumber(record?.dailyOrderNumber)), 0);
  return Math.max(maxStored, records.length) + 1;
}

function orderDailyNumber(record, dateValue = new Date().toISOString()) {
  const stored = numericOrderNumber(record?.dailyOrderNumber);
  if (stored > 0) return stored;
  const records = dailyOrderRecords(orderDailyDateValue(record, dateValue));
  const targetKey = orderIdentityKey(record);
  const index = records.findIndex((item) => orderIdentityKey(item) === targetKey);
  return index >= 0 ? index + 1 : records.length + 1;
}

function ensureOrderNumber(order) {
  if (!order) return "";
  if (!orderNumberValue(order)) {
    order.orderNumber = nextOrderNumber();
  }
  return order.orderNumber;
}

function loadClientId() {
  try {
    const saved = localStorage.getItem(CLIENT_ID_KEY);
    if (saved) return saved;
    const next = safeId("client");
    localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  } catch {
    return safeId("client");
  }
}

function loadPrinterName() {
  try {
    return localStorage.getItem(PRINTER_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function savedTicketPrinterName() {
  return String(state.settings?.ticketPrinterName || printerRuntime.selectedName || loadPrinterName() || "").trim();
}

function savedCommandPrinterName() {
  return String(state.settings?.commandPrinterName || "").trim();
}

function selectedTicketPrinterName() {
  return savedTicketPrinterName() || savedCommandPrinterName();
}

function selectedCommandPrinterName() {
  return savedCommandPrinterName() || savedTicketPrinterName();
}

function commandAutoPrintEnabled() {
  return Boolean(state.settings?.commandAutoPrint);
}

function saveCommandPrinterName(name) {
  state.settings = {
    ...state.settings,
    commandPrinterName: String(name || "").trim(),
  };
  persist();
}

function saveCommandAutoPrint(enabled) {
  state.settings = {
    ...state.settings,
    commandAutoPrint: Boolean(enabled),
  };
  persist();
  render();
}

function ticketMarginLeftMm() {
  return ticketMarginMmFromValue(state.settings?.ticketMarginLeftMm ?? state.settings?.ticketMarginMm);
}

function ticketMarginRightMm() {
  return ticketMarginMmFromValue(state.settings?.ticketMarginRightMm ?? state.settings?.ticketMarginMm);
}

function ticketMarginPayload() {
  return {
    marginMm: ticketMarginLeftMm(),
    marginLeftMm: ticketMarginLeftMm(),
    marginRightMm: ticketMarginRightMm(),
  };
}

function saveTicketMarginMm(side, value) {
  const key = side === "right" ? "ticketMarginRightMm" : "ticketMarginLeftMm";
  state.settings = {
    ...state.settings,
    [key]: ticketMarginMmFromValue(value),
  };
  persist();
  render();
}

function updateTicketMarginMm(side, value) {
  const key = side === "right" ? "ticketMarginRightMm" : "ticketMarginLeftMm";
  state.settings = {
    ...state.settings,
    [key]: ticketMarginMmFromValue(value),
  };
  persist();
  refreshTicketMarginPreview();
}

function ticketMarginMmFromValue(value) {
  const margin = Math.round(Number(value));
  if (!Number.isFinite(margin)) return DEFAULT_TICKET_MARGIN_MM;
  return Math.max(0, Math.min(20, margin));
}

function ticketLogoDataUrl() {
  const value = String(state.settings?.ticketLogoDataUrl || "").trim();
  return value.startsWith("data:image/") ? value : "";
}

function ticketLogoSrc() {
  return ticketLogoDataUrl() || BRAND_IMAGE;
}

function ticketLogoEnabled() {
  return Boolean(state.settings?.ticketLogoEnabled);
}

function ticketLogoWidthMm() {
  const width = Math.round(Number(state.settings?.ticketLogoWidthMm));
  if (!Number.isFinite(width)) return DEFAULT_TICKET_LOGO_WIDTH_MM;
  return Math.max(10, Math.min(48, width));
}

function updateTicketLogoWidthMm(value) {
  state.settings = {
    ...state.settings,
    ticketLogoWidthMm: ticketLogoWidthMmFromValue(value),
  };
  persist();
}

function saveTicketLogoWidthMm(value) {
  updateTicketLogoWidthMm(value);
  render();
}

function ticketLogoWidthMmFromValue(value) {
  const width = Math.round(Number(value));
  if (!Number.isFinite(width)) return DEFAULT_TICKET_LOGO_WIDTH_MM;
  return Math.max(10, Math.min(48, width));
}

function ticketLogoPosition() {
  return state.settings?.ticketLogoPosition === "above-title" ? "above-title" : DEFAULT_TICKET_LOGO_POSITION;
}

function ticketLogoPositionLabel() {
  return ticketLogoPosition() === "above-title" ? "arriba" : "abajo";
}

function setTicketLogoPosition(value) {
  state.settings = {
    ...state.settings,
    ticketLogoPosition: value === "above-title" ? "above-title" : DEFAULT_TICKET_LOGO_POSITION,
  };
  persist();
  render();
}

function ticketLogoPayload() {
  if (!ticketLogoEnabled()) return {};
  return {
    logoDataUrl: ticketLogoDataUrl(),
    logoWidthMm: ticketLogoWidthMm(),
    logoPosition: ticketLogoPosition(),
  };
}

function logoOnlyPayload() {
  return {
    logoDataUrl: ticketLogoDataUrl(),
    logoWidthMm: ticketLogoWidthMm(),
  };
}

function setTicketLogoEnabled(value) {
  state.settings = {
    ...state.settings,
    ticketLogoEnabled: Boolean(value),
  };
  persist();
  render();
}

function clearTicketLogo() {
  state.settings = {
    ...state.settings,
    ticketLogoDataUrl: "",
  };
  persist();
  showToast("Logo de prueba restaurado.");
  render();
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("logo-read-error")));
    reader.readAsDataURL(file);
  });
}

async function changeTicketLogo(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    showToast("Usa un logo PNG o JPG.");
    event.target.value = "";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast("El logo debe pesar menos de 2 MB.");
    event.target.value = "";
    return;
  }
  try {
    const dataUrl = await readImageAsDataUrl(file);
    state.settings = {
      ...state.settings,
      ticketLogoDataUrl: dataUrl,
      ticketLogoEnabled: true,
    };
    persist();
    showToast("Logo de prueba cargado.");
    render();
  } catch {
    showToast("No se pudo cargar el logo.");
  } finally {
    event.target.value = "";
  }
}

function savePrinterName(name) {
  printerRuntime.selectedName = String(name || "").trim();
  state.settings = {
    ...state.settings,
    ticketPrinterName: printerRuntime.selectedName,
  };
  try {
    if (printerRuntime.selectedName) {
      localStorage.setItem(PRINTER_STORAGE_KEY, printerRuntime.selectedName);
    } else {
      localStorage.removeItem(PRINTER_STORAGE_KEY);
    }
  } catch {
    showToast("No se pudo guardar la impresora en este navegador.");
  }
  persist();
}

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeInventory(inventory) {
  const source = Array.isArray(inventory) && inventory.length ? inventory : inventoryItems;
  const normalized = source.map((item, index) => ({
    id: item.id || `inv-${index}-${normalize(item.name || "item").replaceAll(" ", "-")}`,
    category: item.category || "GENERAL",
    name: item.name || "Insumo",
    supplier: item.supplier || "Sin proveedor",
    unit: item.unit || "PZ",
    qty: Number(item.qty) || 0,
    unitCost: Number(item.unitCost) || 0,
    totalCost: Number.isFinite(Number(item.totalCost))
      ? Number(item.totalCost)
      : (Number(item.qty) || 0) * (Number(item.unitCost) || 0),
    costHistory: normalizeCostHistory(item.costHistory),
    recipeEligible: inventoryItemRecipeEligible(item),
  }));
  inventoryItems.forEach((item, index) => {
    if (normalized.some((entry) => normalize(entry.name) === normalize(item.name))) return;
    normalized.push({
      id: item.id || `inv-base-${index}-${normalize(item.name || "item").replaceAll(" ", "-")}`,
      category: item.category || "GENERAL",
      name: item.name || "Insumo",
      supplier: item.supplier || "Sin proveedor",
      unit: item.unit || "PZ",
      qty: Number(item.qty) || 0,
      unitCost: Number(item.unitCost) || 0,
      totalCost: Number.isFinite(Number(item.totalCost))
        ? Number(item.totalCost)
        : (Number(item.qty) || 0) * (Number(item.unitCost) || 0),
      costHistory: normalizeCostHistory(item.costHistory),
      recipeEligible: inventoryItemRecipeEligible(item),
    });
  });
  return normalized;
}

function isDefaultNonRecipeCategory(category) {
  return NON_RECIPE_CATEGORIES.has(String(category || "").trim().toUpperCase());
}

function inventoryItemRecipeEligible(item) {
  if (isDefaultNonRecipeCategory(item?.category)) return false;
  if (Object.prototype.hasOwnProperty.call(item || {}, "recipeEligible")) return item.recipeEligible !== false;
  if (Object.prototype.hasOwnProperty.call(item || {}, "nonRecipe")) return item.nonRecipe !== true;
  return true;
}

function normalizeIngredientCategories(categories = [], inventory = []) {
  const records = new Map();
  const addCategory = (name, recipeEligible = true) => {
    const cleanName = String(name || "").trim().toUpperCase();
    if (!cleanName) return;
    const nextRecipeEligible = !isDefaultNonRecipeCategory(cleanName) && recipeEligible !== false;
    const existing = records.get(cleanName);
    records.set(cleanName, {
      name: cleanName,
      recipeEligible: existing ? existing.recipeEligible !== false && nextRecipeEligible : nextRecipeEligible,
    });
  };
  (Array.isArray(categories) ? categories : []).forEach((category) => {
    if (typeof category === "string") {
      addCategory(category, true);
      return;
    }
    addCategory(category?.name || category?.category, category?.recipeEligible);
  });
  (Array.isArray(inventory) ? inventory : []).forEach((item) => {
    addCategory(item.category, !isDefaultNonRecipeCategory(item.category));
  });
  return [...records.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function normalizeCostHistory(history) {
  return Array.isArray(history)
    ? history
        .map((entry, index) => ({
          id: entry.id || `cost-${index}`,
          previousCost: Math.max(0, Number(entry.previousCost) || 0),
          nextCost: Math.max(0, Number(entry.nextCost) || 0),
          changedAt: entry.changedAt || entry.createdAt || new Date().toISOString(),
          changedBy: entry.changedBy || entry.userId || "",
          reason: cleanUserText(entry.reason || "Cambio de costo"),
        }))
        .slice(0, 50)
    : [];
}

function normalizeUsers(users) {
  const rawUsers = Array.isArray(users) && users.length ? users : defaultUsers;
  const source = rawUsers.filter((user) => user.active !== false);
  const hasAdminAccess = source.some((user) => user.active !== false && normalizeUserFunctions(user).includes("admin"));
  const merged = hasAdminAccess ? source : [...defaultUsers, ...source];
  return merged.map((user) => ({
    ...user,
    password: user.password ?? (sameUsername(user.username, "admin") && !user.passwordHash ? "admin" : ""),
    role: user.role || roleFromFunctions(normalizeUserFunctions(user)),
    functions: normalizeUserFunctions(user),
    active: user.active !== false,
  }));
}

function normalizeCashSessions(cashSessions) {
  return Array.isArray(cashSessions) ? cashSessions : [];
}

function normalizeExpenses(expenses) {
  const source = Array.isArray(expenses) && expenses.length ? expenses : fixedExpenses;
  return source.map((expense, index) => ({
    id: expense.id || `expense-${index}-${normalize(expense.name || expense.supplier || "gasto").replaceAll(" ", "-")}`,
    name: cleanUserText(expense.name || expense.concept || "Gasto"),
    supplier: cleanUserText(expense.supplier || expense.provider || "Sin proveedor"),
    category: cleanUserText(expense.category || "General"),
    amount: Math.max(0, Number(expense.amount) || 0),
    createdAt: expense.createdAt || expense.date || new Date().toISOString(),
    createdBy: expense.createdBy || "",
    cashSessionId: String(expense.cashSessionId || ""),
    source: String(expense.source || ""),
    inventoryItemId: String(expense.inventoryItemId || ""),
    qty: Math.max(0, Number(expense.qty) || 0),
    note: String(expense.note || "").trim(),
  }));
}

function normalizeMenuProducts(products) {
  if (!Array.isArray(products)) return [];
  return products
    .map((product, index) => {
      const name = cleanUserText(product.name || "Platillo");
      const recipe = normalizeRecipe(product.recipe);
      return {
        id: product.id || `custom-${index}-${slugify(name)}`,
        name,
        section: cleanUserText(product.section || "Especiales"),
        subsection: cleanUserText(product.subsection || "Temporada"),
        price: Math.max(0, Number(product.price) || 0),
        station: cleanUserText(product.station || "Cocina"),
        icon: product.icon && icons[product.icon] ? product.icon : "plate",
        description: cleanUserText(product.description || "Platillo creado en LibrePOS."),
        options: normalizeProductOptions(product.options),
        recipe,
        variantRecipes: normalizeVariantRecipes(product.variantRecipes),
        recipeHistory: normalizeProductHistory(product.recipeHistory),
        priceHistory: normalizeProductHistory(product.priceHistory),
        active: product.active !== false,
        // Configuración de mixto (split). Por defecto: heredada del producto si existe.
        splittable: product.splittable === false ? false : undefined,
        splitMaxParts: Number.isFinite(Number(product.splitMaxParts)) ? Math.min(Math.max(Number(product.splitMaxParts), 2), 6) : undefined,
        splitPricePolicy: ["base", "max", "average"].includes(product.splitPricePolicy) ? product.splitPricePolicy : undefined,
        createdAt: product.createdAt || new Date().toISOString(),
        createdBy: product.createdBy || "",
        updatedAt: product.updatedAt || "",
        updatedBy: product.updatedBy || "",
        custom: product.custom !== false,
      };
    })
    .filter((product) => product.name && product.price >= 0);
}

function normalizeExtraCatalog(extras = [], inventory = []) {
  const seen = new Set();
  return (Array.isArray(extras) ? extras : [])
    .map((extra, index) => {
      const name = cleanUserText(extra.name || extra.extra || `Extra ${index + 1}`);
      if (!name) return null;
      const inventoryItemId = String(extra.inventoryItemId || extra.itemId || "");
      const inventoryItem = inventory.find((item) => item.id === inventoryItemId)
        || inventory.find((item) => normalize(item.name) === normalize(extra.inventoryItemName || extra.itemName || extra.name));
      const id = String(extra.id || `extra-${index}-${slugify(name)}`);
      const key = normalize(id || name);
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        id,
        name,
        price: roundCurrency(Math.max(0, Number(extra.price ?? extra.total ?? extra.priceDelta) || 0)),
        inventoryItemId: inventoryItem?.id || inventoryItemId,
        inventoryItemName: inventoryItem?.name || String(extra.inventoryItemName || extra.itemName || "").trim().toUpperCase(),
        unit: inventoryItem?.unit || String(extra.unit || "PZ").trim().toUpperCase(),
        qty: Math.max(0, Number(extra.qty ?? extra.gramaje ?? extra.grams) || 0),
        priceHistory: normalizeProductHistory(extra.priceHistory),
        active: extra.active !== false,
        createdAt: extra.createdAt || new Date().toISOString(),
        createdBy: extra.createdBy || "",
        updatedAt: extra.updatedAt || "",
        updatedBy: extra.updatedBy || "",
      };
    })
    .filter((extra) => extra && extra.name && extra.price >= 0 && extra.qty >= 0);
}

function normalizeProductOptions(options = []) {
  return (Array.isArray(options) ? options : [])
    .map((option, optionIndex) => {
      const label = cleanUserText(option.label || option.id || `Opcion ${optionIndex + 1}`);
      return {
        id: String(option.id || slugify(label) || `opcion-${optionIndex + 1}`),
        label,
        type: option.type === "multi" ? "multi" : "single",
        required: option.required !== false,
        // splittable explícito sólo cuando se desactiva. Si no, por defecto las
        // opciones single se consideran divisibles automáticamente en runtime.
        splittable: option.splittable === false ? false : undefined,
        choices: (Array.isArray(option.choices) ? option.choices : [])
          .map((choice) => {
            const source = choice && typeof choice === "object" ? choice : {};
            const choiceLabel = cleanUserText(choice?.label || choice || "");
            if (!choiceLabel) return null;
            return {
              ...source,
              label: choiceLabel,
              active: choice?.active !== false,
            };
          })
          .filter(Boolean),
      };
    })
    .filter((option) => option.label && option.choices.length);
}

function normalizeVariantRecipes(variantRecipes = []) {
  return (Array.isArray(variantRecipes) ? variantRecipes : [])
    .map((variant, index) => {
      const optionId = String(variant.optionId || "").trim();
      const choiceLabel = cleanUserText(variant.choiceLabel || variant.label || "");
      const recipe = normalizeRecipe(variant.recipe);
      if (!optionId || !choiceLabel || !recipe.length) return null;
      return {
        id: variant.id || `variant-${index}-${slugify(`${optionId}-${choiceLabel}`)}`,
        optionId,
        choiceLabel,
        recipe,
        updatedAt: variant.updatedAt || "",
        updatedBy: variant.updatedBy || "",
      };
    })
    .filter(Boolean);
}

function normalizeProductHistory(history = []) {
  return (Array.isArray(history) ? history : [])
    .map((entry, index) => ({
      id: entry.id || `history-${index}`,
      changedAt: entry.changedAt || entry.createdAt || new Date().toISOString(),
      changedBy: entry.changedBy || entry.userId || "",
      reason: cleanUserText(entry.reason || "Cambio"),
      previous: cloneValue(entry.previous),
      next: cloneValue(entry.next),
    }))
    .slice(0, 50);
}

function normalizeRecipe(recipe = []) {
  const merged = new Map();
  (Array.isArray(recipe) ? recipe : []).forEach((entry) => {
    const name = String(entry.name || "").trim().toUpperCase();
    const qty = Math.max(0, Number(entry.qty) || 0);
    if (!name || qty <= 0) return;
    const key = normalize(name);
    const existing = merged.get(key);
    if (existing) {
      existing.qty += qty;
      return;
    }
    merged.set(key, {
      itemId: String(entry.itemId || ""),
      name,
      unit: String(entry.unit || "PZ").trim().toUpperCase(),
      qty,
    });
  });
  return [...merged.values()];
}

function normalizeUserFunctions(user) {
  const valid = new Set(userFunctionOptions.map((item) => item.id));
  const source = Array.isArray(user.functions) && user.functions.length ? user.functions : functionsFromRole(user.role);
  const normalized = source.filter((item) => valid.has(item));
  if (normalized.includes("admin")) return ["admin", "mesero", "cocina", "caja"];
  return normalized.length ? normalized : ["mesero"];
}

function functionsFromRole(role = "") {
  const value = normalize(role);
  if (value.includes("admin")) return ["admin", "mesero", "cocina", "caja"];
  if (value.includes("cocina")) return ["cocina"];
  if (value.includes("caja")) return ["caja"];
  return ["mesero"];
}

function roleFromFunctions(functions) {
  if (functions.includes("admin")) return "Administrador";
  if (functions.length > 1) return functions.map(functionLabel).join(" + ");
  return functionLabel(functions[0] || "mesero");
}

function functionLabel(id) {
  return userFunctionOptions.find((item) => item.id === id)?.label || id;
}

function hasUserFunction(user, functionId) {
  const functions = normalizeUserFunctions(user);
  return functions.includes("admin") || functions.includes(functionId);
}

function isAdminUser(user = currentUser()) {
  return Boolean(user && normalizeUserFunctions(user).includes("admin"));
}

function hasCashAccess(user = currentUser()) {
  return Boolean(user && hasUserFunction(user, "caja"));
}

function isCashOpen() {
  return Boolean(currentCashSession());
}

function cleanUserText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizedUsername(value) {
  return cleanUserText(value).toLocaleLowerCase("es-MX");
}

function sameUsername(left, right) {
  return normalizedUsername(left) === normalizedUsername(right);
}

function availableWaiters() {
  const waiters = state.users.filter((item) => item.active && hasUserFunction(item, "mesero"));
  return waiters.length ? waiters : state.users.filter((item) => item.active);
}

function persist() {
  persistLocal();
  queueSyncState();
}

function persistLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast("No se pudo guardar en este navegador.");
  }
}

function sharedStateFromCurrent() {
  return Object.fromEntries(SHARED_STATE_KEYS.map((key) => [key, cloneValue(state[key])]));
}

function normalizeSharedState(shared = {}) {
  const inventory = normalizeInventory(shared.inventory);
  return {
    settings: { ...defaultState.settings, ...(shared.settings || {}) },
    users: normalizeUsers(shared.users),
    orders: Array.isArray(shared.orders) ? shared.orders : [],
    sales: Array.isArray(shared.sales) ? shared.sales : [],
    cancellations: Array.isArray(shared.cancellations) ? shared.cancellations : [],
    inventory,
    ingredientCategories: normalizeIngredientCategories(shared.ingredientCategories, inventory),
    inventoryMovements: Array.isArray(shared.inventoryMovements) ? shared.inventoryMovements : [],
    expenses: normalizeExpenses(shared.expenses),
    menuProducts: normalizeMenuProducts(shared.menuProducts),
    extraCatalog: normalizeExtraCatalog(shared.extraCatalog, inventory),
    attendance: Array.isArray(shared.attendance) ? shared.attendance : [],
    cashSessions: normalizeCashSessions(shared.cashSessions),
  };
}

function applySharedState(shared) {
  const localSession = {
    sessionUserId: state.sessionUserId,
    authError: state.authError,
    view: state.view,
    navPage: state.navPage,
    activeOrderId: state.activeOrderId,
    activeSection: state.activeSection,
    activeSubsection: state.activeSubsection,
    productSearch: state.productSearch,
    recipesMode: state.recipesMode,
    recipesSection: state.recipesSection,
    recipesSubsection: state.recipesSubsection,
    recipesSearch: state.recipesSearch,
    ingredientsCategory: state.ingredientsCategory,
    ingredientsCategoryScroll: state.ingredientsCategoryScroll,
    ingredientsCategorySearch: state.ingredientsCategorySearch,
    ingredientsSearch: state.ingredientsSearch,
    extrasSearch: state.extrasSearch,
    dataOrderSearch: state.dataOrderSearch,
    dataOrderFrom: state.dataOrderFrom,
    dataOrderTo: state.dataOrderTo,
    dataOrderStatus: state.dataOrderStatus,
    productConfig: state.productConfig,
    modal: state.modal,
    paymentMethod: state.paymentMethod,
    updateInfo: state.updateInfo,
    updateBusy: state.updateBusy,
  };
  state = {
    ...state,
    ...normalizeSharedState(shared),
    ...localSession,
  };
  if (state.activeOrderId && !getOrder(state.activeOrderId)) state.activeOrderId = null;
}

function queueSyncState() {
  if (!syncEnabled) return;
  clearTimeout(syncPushTimer);
  syncPushTimer = window.setTimeout(pushSharedState, 150);
}

async function pushSharedState() {
  if (!syncEnabled) return;
  const shared = sharedStateFromCurrent();
  const serialized = JSON.stringify(shared);
  if (serialized === syncLastPayload) return;
  const baseSnapshot = parseSnapshot(syncLastPayload);
  syncLastPayload = serialized;
  try {
    const response = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: syncClientId, baseVersion: syncVersion, state: shared }),
    });
    const payload = await response.json();
    if (response.status === 409) {
      await resolveSyncConflict(payload, shared, baseSnapshot);
      return;
    }
    if (!response.ok) return;
    syncVersion = Number(payload.version) || syncVersion;
    if (payload.state) {
      applySharedState(payload.state);
      syncLastPayload = JSON.stringify(sharedStateFromCurrent());
      persistLocal();
      render();
    }
  } catch {
    // The app still works locally when the sync server is not available.
  }
}

async function resolveSyncConflict(payload, localShared, base) {
  if (!payload.state) return;
  const remote = normalizeSharedState(payload.state);
  const merged = mergeSharedStates(base, localShared, remote);
  syncVersion = Number(payload.version) || syncVersion;
  applySharedState(merged);
  syncLastPayload = JSON.stringify(remote);
  persistLocal();
  try {
    const retry = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: syncClientId, baseVersion: syncVersion, state: sharedStateFromCurrent() }),
    });
    if (!retry.ok) return;
    const saved = await retry.json();
    syncVersion = Number(saved.version) || syncVersion;
    if (saved.state) applySharedState(saved.state);
    syncLastPayload = JSON.stringify(sharedStateFromCurrent());
    persistLocal();
    render();
  } catch {
    // Keep the merged local state; the next save will try again.
  }
}

function parseSnapshot(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function mergeSharedStates(base = {}, local = {}, remote = {}) {
  const merged = {};
  SHARED_STATE_KEYS.forEach((key) => {
    if (Array.isArray(local[key]) || Array.isArray(remote[key])) {
      merged[key] = mergeArrayById(base[key], local[key], remote[key], key);
      return;
    }
    merged[key] = chooseMergedValue(base[key], local[key], remote[key]);
  });
  return normalizeSharedState(merged);
}

function mergeArrayById(baseValue = [], localValue = [], remoteValue = [], key = "") {
  const base = Array.isArray(baseValue) ? baseValue : [];
  const local = Array.isArray(localValue) ? localValue : [];
  const remote = Array.isArray(remoteValue) ? remoteValue : [];
  const source = [...base, ...local, ...remote];
  if (!source.some((item) => item?.id)) {
    return chooseMergedValue(base, local, remote) || [];
  }
  const ids = new Set(source.map((item) => item?.id).filter(Boolean));
  return [...ids].map((id) => mergeEntity(
    base.find((item) => item?.id === id),
    local.find((item) => item?.id === id),
    remote.find((item) => item?.id === id),
    key,
  )).filter(Boolean);
}

function mergeEntity(base, local, remote, key) {
  if (key === "orders") {
    const merged = chooseMergedObject(base, local, remote);
    if (!merged) return null;
    merged.items = mergeArrayById(base?.items, local?.items, remote?.items, "order-items");
    merged.commandBatches = mergeArrayById(base?.commandBatches, local?.commandBatches, remote?.commandBatches, "command-batches");
    merged.alerts = mergeArrayById(base?.alerts, local?.alerts, remote?.alerts, "alerts");
    return merged;
  }
  return chooseMergedValue(base, local, remote);
}

function chooseMergedObject(base, local, remote) {
  const chosen = chooseMergedValue(base, local, remote);
  return chosen && typeof chosen === "object" ? chosen : null;
}

function chooseMergedValue(base, local, remote) {
  const localChanged = !isSameJson(local, base);
  const remoteChanged = !isSameJson(remote, base);
  if (localChanged && !remoteChanged) return cloneValue(local);
  if (!localChanged && remoteChanged) return cloneValue(remote);
  if (localChanged && remoteChanged && isPlainObject(local) && isPlainObject(remote)) {
    return { ...cloneValue(remote), ...cloneValue(local) };
  }
  if (localChanged && remoteChanged) return cloneValue(local);
  return cloneValue(remote ?? local ?? base);
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isSameJson(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

async function initNetworkSync() {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    syncEnabled = true;
    syncVersion = Number(payload.version) || 0;
    if (payload.state) {
      applySharedState(payload.state);
      const remotePayload = JSON.stringify(payload.state);
      const normalizedPayload = JSON.stringify(sharedStateFromCurrent());
      syncLastPayload = remotePayload;
      persistLocal();
      render();
      if (normalizedPayload !== remotePayload) queueSyncState();
    } else {
      pushSharedState();
    }
    startSyncEvents();
  } catch {
    // Running without the LAN sync server leaves localStorage behavior unchanged.
  }
}

function startSyncEvents() {
  if (!("EventSource" in window)) {
    window.setInterval(pollSyncState, 2500);
    return;
  }
  const source = new EventSource(`/api/events?clientId=${encodeURIComponent(syncClientId)}`);
  source.addEventListener("state", (event) => {
    const payload = JSON.parse(event.data);
    applyRemoteSyncPayload(payload);
  });
  source.onerror = () => {
    source.close();
    window.setInterval(pollSyncState, 2500);
  };
}

async function pollSyncState() {
  if (!syncEnabled) return;
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) return;
    applyRemoteSyncPayload(await response.json());
  } catch {
    // Ignore transient network drops.
  }
}

function applyRemoteSyncPayload(payload) {
  const version = Number(payload.version) || 0;
  if (!payload.state || version <= syncVersion || payload.clientId === syncClientId) return;
  syncVersion = version;
  applySharedState(payload.state);
  syncLastPayload = JSON.stringify(sharedStateFromCurrent());
  persistLocal();
  render();
}

async function checkForUpdates() {
  try {
    const response = await fetch("/api/update/status", { cache: "no-store" });
    if (!response.ok) return;
    const info = await response.json();
    const previous = state.updateInfo || {};
    const changed =
      previous.available !== info.available ||
      previous.remoteCommit !== info.remoteCommit ||
      previous.localCommit !== info.localCommit;
    state.updateInfo = info;
    if (changed && currentUser()) render();
  } catch {
    // The update button stays hidden when GitHub or the local server is unavailable.
  }
}

async function applyUpdate() {
  if (state.updateBusy) return;
  state.updateBusy = true;
  render();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 360000);
  try {
    const response = await fetch("/api/update/apply", { method: "POST", signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "update-failed");
    state.updateInfo = {
      ...(state.updateInfo || {}),
      ...payload,
      available: false,
      localCommit: payload.remoteCommit || state.updateInfo?.remoteCommit || state.updateInfo?.localCommit,
    };
    showToast(
      payload.installError
        ? "LibrePOS actualizado. Cierra y abre; si no arranca, ejecuta Instalar LibrePOS."
        : payload.updated
        ? "LibrePOS actualizado desde GitHub. Cierra y abre LibrePOS."
        : "LibrePOS ya estaba actualizado.",
    );
  } catch (error) {
    const message = String(error?.message || "");
    if (error?.name === "AbortError") {
      showToast("La actualizacion tardo demasiado. Cierra y abre LibrePOS antes de reintentar.");
    } else if (message.includes("update-in-progress")) {
      showToast("Ya hay una actualizacion en curso.");
    } else if (message.includes("github") || message.includes("download")) {
      showToast("No se pudo conectar a GitHub. Revisa la conexion.");
    } else {
      showToast("No se pudo actualizar LibrePOS.");
    }
  } finally {
    window.clearTimeout(timeoutId);
    state.updateBusy = false;
    persistLocal();
    render();
  }
}

function setTheme() {
  const theme = themes.find((item) => item.id === state.settings.theme) || themes[0];
  document.documentElement.style.setProperty("--brand", theme.brand);
  document.documentElement.style.setProperty("--brand-strong", theme.strong);
  document.documentElement.style.setProperty("--brand-soft", theme.soft);
  document.documentElement.style.setProperty("--teal", theme.teal);
}

function svg(name, className = "icon") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.plate}</svg>`;
}

function currentUser() {
  return state.users.find((user) => user.id === state.sessionUserId) || null;
}

function normalizeAccessUrl(value) {
  const fallback = `${window.location.origin}/`;
  try {
    const url = new URL(value || fallback, fallback);
    url.hash = "";
    url.search = "";
    url.pathname = "/";
    return url.toString();
  } catch {
    return fallback;
  }
}

function appAccessUrl() {
  return normalizeAccessUrl(accessInfo.preferredUrl || accessInfo.urls?.[0] || window.location.origin);
}

function qrSvgFor(value) {
  try {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    return qr.createSvgTag(3, 2);
  } catch {
    return "";
  }
}

async function loadAccessInfo() {
  try {
    const response = await fetch("/api/access-info", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    const urls = Array.isArray(payload.urls) ? payload.urls.map(normalizeAccessUrl) : [];
    accessInfo = {
      preferredUrl: normalizeAccessUrl(payload.preferredUrl || urls[0] || window.location.origin),
      urls,
    };
    if (currentUser() && state.view === "profile" && isAdminUser()) render();
  } catch {
    // The QR falls back to the current browser URL when the local server endpoint is unavailable.
  }
}

function getActiveOrder() {
  return state.orders.find((order) => order.id === state.activeOrderId && order.status === "open") || null;
}

function getOpenOrders() {
  return state.orders.filter((order) => order.status === "open");
}

function currentInventory() {
  state.inventory = normalizeInventory(state.inventory);
  return state.inventory;
}

function ingredientCategoryRecords() {
  state.ingredientCategories = normalizeIngredientCategories(state.ingredientCategories, state.inventory);
  return state.ingredientCategories;
}

function ingredientCategoryNames() {
  return ingredientCategoryRecords().map((category) => category.name);
}

function categoryRecipeEligible(categoryName) {
  const name = String(categoryName || "").trim().toUpperCase();
  if (!name || isDefaultNonRecipeCategory(name)) return false;
  const category = ingredientCategoryRecords().find((item) => item.name === name);
  return category?.recipeEligible !== false;
}

function isRecipeIngredient(item) {
  return categoryRecipeEligible(item?.category) && item?.recipeEligible !== false;
}

function recipeInventoryItems() {
  return currentInventory().filter(isRecipeIngredient);
}

function getTableOrder(number) {
  return getOpenOrders().find((order) => order.type === "table" && Number(order.tableNumber) === Number(number)) || null;
}

function getOrder(orderId) {
  return state.orders.find((order) => order.id === orderId && order.status === "open") || null;
}

function findLine(lineId) {
  for (const order of getOpenOrders()) {
    const line = order.items.find((item) => item.id === lineId);
    if (line) return { order, line };
  }
  return null;
}

function activeAlerts(order) {
  return (order.alerts || []).filter((alert) => !alert.clearedAt);
}

function addOrderAlert(order, message, tone = "cancel") {
  order.alerts = order.alerts || [];
  order.alerts.unshift({
    id: safeId("alert"),
    tone,
    message,
    createdAt: new Date().toISOString(),
    createdBy: currentUser()?.id,
  });
}

function recordCancellation(entry) {
  state.cancellations = Array.isArray(state.cancellations) ? state.cancellations : [];
  state.cancellations.unshift({
    id: safeId("cancel"),
    createdAt: new Date().toISOString(),
    createdBy: currentUser()?.id,
    ...entry,
  });
}

const tableStateMeta = {
  free: { label: "Libre", legend: "Libre" },
  open: { label: "Sin comanda", legend: "Sin pedido" },
  ordering: { label: "Por comandar", legend: "Por comandar" },
  waiting: { label: "Esperando cocina", legend: "Esperando" },
  preparing: { label: "En cocina", legend: "En cocina" },
  ready: { label: "Listo para entregar", legend: "Listo" },
  served: { label: "Entregado", legend: "Entregado" },
};

function tableState(order) {
  if (!order) return "free";
  const totals = calculateTotals(order);
  const batches = (order.commandBatches || []).filter((batch) => batch.status !== "cancelled");
  if (batches.some((batch) => batch.status === "ready")) return "ready";
  if (batches.some((batch) => batch.status === "preparing")) return "preparing";
  if (batches.some((batch) => !batch.status || batch.status === "new")) return "waiting";
  if (totals.pending) return "ordering";
  if (order.items.length && batches.length && batches.every((batch) => batch.status === "delivered")) return "served";
  return "open";
}

function lastKitchenTime(order) {
  const batches = (order.commandBatches || []).filter((batch) => batch.status !== "cancelled");
  const latest = [...batches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  if (!latest) return "Sin comanda";
  if (latest.status === "delivered") return `Entregada hace ${elapsed(latest.deliveredAt || latest.updatedAt || latest.createdAt)}`;
  if (latest.status === "ready") return `Lista hace ${elapsed(latest.readyAt || latest.updatedAt || latest.createdAt)}`;
  if (latest.status === "preparing") return `Prep. ${elapsed(latest.startedAt || latest.updatedAt || latest.createdAt)}`;
  return `Espera ${elapsed(latest.createdAt)}`;
}

function lineServiceStatus(item, order) {
  if (item.status === "pending") return "pending";
  const commandIds = item.commandIds || [];
  const batches = (order.commandBatches || []).filter(
    (batch) =>
      batch.status !== "cancelled" &&
      (commandIds.includes(batch.id) || (batch.lines || []).some((line) => line.lineId === item.id)),
  );
  if (!batches.length) return "waiting";
  if (batches.some((batch) => batch.status === "ready")) return "ready";
  if (batches.some((batch) => batch.status === "preparing")) return "preparing";
  if (batches.some((batch) => !batch.status || batch.status === "new")) return "waiting";
  if (batches.every((batch) => batch.status === "delivered")) return "delivered";
  return "waiting";
}

function lineStatusLabel(status) {
  return {
    pending: "Por comandar",
    waiting: "Esperando cocina",
    preparing: "En cocina",
    ready: "Listo",
    delivered: "Entregado",
  }[status] || "Comandado";
}

function readyBatches(order) {
  return (order.commandBatches || []).filter((batch) => batch.status === "ready");
}

function batchQty(batch) {
  return (batch.lines || []).reduce((sum, line) => sum + line.qty, 0);
}

function findBatchForLine(order, lineId, commandId = "", allowedStatuses = []) {
  const batches = order?.commandBatches || [];
  const normalizedStatuses = allowedStatuses.map((status) => (status === "new" ? "" : status));
  const matchesStatus = (batch) => {
    if (!allowedStatuses.length) return true;
    const status = batch.status || "new";
    return allowedStatuses.includes(status) || normalizedStatuses.includes(batch.status || "");
  };
  if (commandId) {
    return batches.find(
      (batch) => batch.id === commandId && matchesStatus(batch) && (batch.lines || []).some((line) => line.lineId === lineId),
    );
  }
  return batches.find((batch) => matchesStatus(batch) && (batch.lines || []).some((line) => line.lineId === lineId));
}

// Devuelve el batch (comanda) que contiene la línea, sin filtrar por status.
// Útil para saber si la cocina ya empezó a prepararla.
function findBatchContainingLine(order, lineId) {
  if (!order || !lineId) return null;
  return (order.commandBatches || []).find((batch) =>
    (batch.lines || []).some((line) => line.lineId === lineId),
  ) || null;
}

// Una línea es editable mientras:
//  - aún no fue comandada (status pending), o
//  - ya está en cocina pero el batch sigue en estado "new" (no se ha empezado a preparar).
// Si la cocina ya marcó "preparing" o "ready", la línea queda bloqueada.
function lineIsEditable(order, line) {
  if (!order || !line) return false;
  if (line.status === "pending") return true;
  if (line.status !== "commanded") return false;
  const batch = findBatchContainingLine(order, line.id);
  return Boolean(batch && (batch.status || "new") === "new");
}

function cancellationStageLabel(stage) {
  return {
    new: "Esperando cocina",
    waiting: "Esperando cocina",
    preparing: "En preparacion",
    ready: "Listo para entregar",
    pending: "Por comandar",
    order: "Orden completa",
  }[stage || "new"] || "Cancelacion";
}

function baseMenuProductIds() {
  return new Set(menuCatalog.map((product) => product.id));
}

function menuProducts({ includeInactive = false } = {}) {
  state.menuProducts = normalizeMenuProducts(state.menuProducts);
  const savedById = new Map(state.menuProducts.map((product) => [product.id, product]));
  const baseProducts = menuCatalog
    .map((base) => {
      const saved = savedById.get(base.id);
      const merged = saved
        ? {
            ...base,
            ...saved,
            options: Array.isArray(saved.options) && saved.options.length ? saved.options : base.options,
            variantRecipes: normalizeVariantRecipes(saved.variantRecipes),
            station: saved.station || base.station || "Cocina",
            custom: false,
            edited: true,
          }
        : { ...base, active: true, custom: false, edited: false };
      return merged;
    })
    .filter((product) => includeInactive || product.active !== false);
  const baseIds = baseMenuProductIds();
  const customProducts = state.menuProducts
    .filter((product) => !baseIds.has(product.id))
    .filter((product) => includeInactive || product.active !== false);
  return [...baseProducts, ...customProducts];
}

function activeMenuProducts() {
  return menuProducts().filter((item) => item.active !== false);
}

function extraCatalog({ includeInactive = false } = {}) {
  state.extraCatalog = normalizeExtraCatalog(state.extraCatalog, currentInventory());
  return state.extraCatalog.filter((extra) => includeInactive || extra.active !== false);
}

function activeExtras() {
  return extraCatalog().filter((extra) => extra.active !== false);
}

function getExtraDefinition(id) {
  return extraCatalog({ includeInactive: true }).find((extra) => extra.id === id);
}

function extraInventoryItem(extra) {
  const inventory = currentInventory();
  return inventory.find((item) => item.id === extra?.inventoryItemId)
    || inventory.find((item) => normalize(item.name) === normalize(extra?.inventoryItemName));
}

function inventoryItemHasEstimatedExtraUsage(item) {
  if (!item) return false;
  const records = [
    ...(Array.isArray(state.orders) ? state.orders : []),
    ...(Array.isArray(state.sales) ? state.sales : []),
  ];
  const usedInLines = records.some((record) =>
    (record.items || []).some((line) =>
      normalizeExtras(line.extras).some((extra) =>
        extra.itemId === item.id || normalize(extra.inventoryItemName || extra.name) === normalize(item.name),
      ),
    ),
  );
  if (usedInLines) return true;
  return (Array.isArray(state.inventoryMovements) ? state.inventoryMovements : []).some(
    (movement) => movement.itemId === item.id && movement.estimated,
  );
}

function getProduct(id) {
  return menuProducts({ includeInactive: true }).find((item) => item.id === id);
}

function sections() {
  return [...new Set(activeMenuProducts().map((item) => item.section))];
}

function subsectionsFor(section) {
  return ["Todos", ...new Set(activeMenuProducts().filter((item) => item.section === section).map((item) => item.subsection))];
}

function defaultSelectionsFor(product) {
  const selections = {};
  product.options.forEach((option) => {
    if (option.type === "multi") {
      selections[option.id] = [];
      return;
    }
    selections[option.id] = firstActiveChoiceIndex(option);
  });
  return selections;
}

/* ===== Mixto (split) =================================================
   Un platillo puede prepararse "mixto" cuando tiene >=2 opciones single
   y no se desactivó explícitamente. Cada parte (1/N) lleva su propia
   selección para las opciones divisibles; las opciones no divisibles
   y los extras son comunes para todas las partes.
===================================================================== */

function singleOptions(product) {
  return (product?.options || []).filter((option) => option?.type === "single");
}

function splittableOptions(product) {
  return singleOptions(product).filter((option) => option.splittable !== false);
}

function productIsSplittable(product) {
  if (!product || product.splittable === false) return false;
  // Es splittable cualquier producto que tenga al menos una opción "single"
  // con dos o más variantes activas. Antes pedíamos ≥2 opciones single, lo
  // que dejaba fuera empanadas (1 opción, varios rellenos). Ahora también
  // se puede pedir mitad/mitad de rellenos distintos.
  return splittableOptions(product).some((option) => {
    const activeChoices = (option.choices || []).filter((c) => c.active !== false);
    return activeChoices.length >= 2;
  });
}

function splitMaxParts(product) {
  const max = Math.min(Math.max(Number(product?.splitMaxParts) || 4, 2), 6);
  return max;
}

function splitPricePolicy(product) {
  const allowed = ["base", "max", "average"];
  const policy = String(product?.splitPricePolicy || "base").toLowerCase();
  return allowed.includes(policy) ? policy : "base";
}

function lineParts(line) {
  return Array.isArray(line?.parts) && line.parts.length >= 2 ? line.parts : null;
}

function partWeight(parts, index) {
  if (!Array.isArray(parts) || !parts.length) return 1;
  const part = parts[index];
  if (part && Number.isFinite(Number(part.weight))) return Number(part.weight);
  return 1 / parts.length;
}

// Combina selecciones comunes (line.selections) con las de una parte
// específica para alimentar a las recetas/precio existentes sin tocarlas.
function selectionsForPart(line, partIndex) {
  const baseSelections = line?.selections || {};
  const parts = lineParts(line);
  if (!parts) return baseSelections;
  const partSelections = parts[partIndex]?.selections || {};
  return { ...baseSelections, ...partSelections };
}

function roundQty(value) {
  return Math.round((Number(value) || 0) * 1000000) / 1000000;
}

// Receta del producto combinando todas las partes, ponderada por weight.
// Si no hay parts, devuelve la receta normal con selecciones completas.
function combinedRecipeForLine(product, line) {
  const parts = lineParts(line);
  if (!parts) {
    return inventoryRecipeForSelections(product, line?.selections || defaultSelectionsFor(product));
  }
  const aggregate = new Map();
  parts.forEach((_, idx) => {
    const sel = selectionsForPart(line, idx);
    const weight = partWeight(parts, idx);
    const recipe = inventoryRecipeForSelections(product, sel);
    recipe.forEach((item) => {
      const key = item.name;
      const prev = aggregate.get(key) || { name: item.name, qty: 0 };
      prev.qty += Number(item.qty) * weight;
      aggregate.set(key, prev);
    });
  });
  return Array.from(aggregate.values()).map((item) => ({ name: item.name, qty: roundQty(item.qty) }));
}

// Precio unitario considerando parts y política configurada.
function combinedUnitPrice(product, line, extras = []) {
  const parts = lineParts(line);
  if (!parts) {
    return configuredUnitPrice(product, line?.selections || {}, extras);
  }
  const policy = splitPricePolicy(product);
  let core;
  if (policy === "max") {
    core = Math.max(
      ...parts.map((_, idx) => configuredUnitPrice(product, selectionsForPart(line, idx), [])),
    );
  } else if (policy === "average") {
    const prices = parts.map((_, idx) => configuredUnitPrice(product, selectionsForPart(line, idx), []));
    core = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  } else {
    // "base": el plato cuesta exactamente como el producto base, sin recargo.
    core = Number(product.price) || 0;
  }
  return Math.round((core + extraUnitTotal(extras)) * 100) / 100;
}

// Resumen legible para tickets, cocina y reportes: comunes + cada parte.
function combinedOptionSummary(product, line, extras = []) {
  const parts = lineParts(line);
  if (!parts) {
    return optionSummary(product, line?.selections || {}, extras);
  }
  const splitIds = new Set(splittableOptions(product).map((opt) => opt.id));
  const partsText = parts.map((_, idx) => {
    const sel = parts[idx]?.selections || {};
    const labels = [];
    splittableOptions(product).forEach((option) => {
      const choice = option.choices[sel[option.id]];
      if (choice) labels.push(`${option.label}: ${choice.label}`);
    });
    return `Parte ${idx + 1} → ${labels.join(" · ") || "—"}`;
  });
  const commonParts = [];
  (product.options || []).forEach((option) => {
    if (splitIds.has(option.id)) return;
    if (option.type === "single") {
      const choice = option.choices[line?.selections?.[option.id]];
      if (choice) commonParts.push(`${option.label}: ${choice.label}`);
    } else if (option.type === "multi") {
      const selected = line?.selections?.[option.id];
      if (Array.isArray(selected) && selected.length) {
        const labels = selected.map((i) => option.choices[i]?.label).filter(Boolean);
        if (labels.length) commonParts.push(`${option.label}: ${labels.join(", ")}`);
      }
    }
  });
  const extraParts = normalizeExtras(extras).map(
    (extra) => `${extra.name}${extra.count > 1 ? ` x${formatNumber(extra.count)}` : ""} (+${money.format(extra.total)})`,
  );
  return [
    `Mixto ×${parts.length}`,
    ...partsText,
    ...commonParts,
    ...(extraParts.length ? [`Extras: ${extraParts.join(", ")}`] : []),
  ].join(" · ");
}

// ¿Todas las partes tienen selecciones válidas?
function lineHasAvailableParts(product, line) {
  const parts = lineParts(line);
  if (!parts) return productHasAvailableSelections(product, line?.selections || defaultSelectionsFor(product));
  return parts.every((_, idx) => productHasAvailableSelections(product, selectionsForPart(line, idx)));
}

function firstActiveChoiceIndex(option) {
  const index = (option.choices || []).findIndex((choice) => choice.active !== false);
  return index >= 0 ? index : -1;
}

function activeChoiceEntries(option) {
  return (option.choices || [])
    .map((choice, index) => ({ choice, index }))
    .filter(({ choice }) => choice.active !== false);
}

function productHasAvailableSelections(product, selections = defaultSelectionsFor(product)) {
  return (product.options || []).every((option) => {
    if (option.type === "multi") return true;
    const selected = selections[option.id];
    return selected >= 0 && option.choices?.[selected]?.active !== false;
  });
}

function normalizeExtras(extras) {
  if (!Array.isArray(extras)) return [];
  return extras
    .map((extra) => {
      const qty = Math.max(0, Number(extra.qty) || 0);
      const unitCost = Math.max(0, Number(extra.unitCost) || 0);
      const price = roundCurrency(Math.max(0, Number(extra.price ?? extra.total ?? extra.priceDelta) || 0));
      const count = Math.max(1, Number(extra.count) || 1);
      return {
        extraId: String(extra.extraId || ""),
        itemId: String(extra.itemId || extra.inventoryItemId || ""),
        name: String(extra.name || "").trim().toUpperCase(),
        inventoryItemName: String(extra.inventoryItemName || extra.itemName || extra.inventoryName || extra.name || "").trim().toUpperCase(),
        unit: String(extra.unit || "PZ").trim().toUpperCase(),
        qty,
        count,
        price,
        unitCost,
        costTotal: roundCurrency(qty * unitCost),
        total: price,
      };
    })
    .filter((extra) => extra.name && extra.qty > 0);
}

function extraUnitTotal(extras = []) {
  return normalizeExtras(extras).reduce((sum, extra) => sum + extra.total, 0);
}

function extraUnitCostTotal(extras = []) {
  return normalizeExtras(extras).reduce((sum, extra) => sum + extra.costTotal, 0);
}

function calculateTotals(order) {
  const subtotal = roundCurrency(order.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0));
  const tax = taxBreakdownForGross(subtotal, orderIvaRate(order));
  const statusCounts = order.items.reduce(
    (acc, item) => {
      const status = lineServiceStatus(item, order);
      acc[status] = (acc[status] || 0) + item.qty;
      if (status !== "pending") acc.commanded += item.qty;
      return acc;
    },
    { pending: 0, waiting: 0, preparing: 0, ready: 0, delivered: 0, commanded: 0 },
  );
  return {
    subtotal,
    ivaEnabled: tax.ivaRate > 0,
    taxEnabled: tax.ivaRate > 0,
    netSubtotal: tax.netSubtotal,
    taxableSubtotal: tax.netSubtotal,
    iva: tax.iva,
    taxAmount: tax.iva,
    ivaRate: tax.ivaRate,
    taxRate: tax.ivaRate,
    total: subtotal,
    count: order.items.reduce((sum, item) => sum + item.qty, 0),
    ...statusCounts,
  };
}

function orderLabel(order) {
  if (order.type === "table") return `Mesa ${order.tableNumber}`;
  const name = String(order.customerName || "").trim();
  return name && name !== "Mostrador" ? `Para llevar · ${name}` : "Para llevar";
}

function waiterName(id) {
  return state.users.find((user) => user.id === id)?.name || "Sin mesero";
}

function showToast(message) {
  clearTimeout(toastTimer);
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function celebrateAction(type = "success", source, label = "") {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const oldBurst = document.querySelector(".celebration-burst");
  oldBurst?.remove();
  clearTimeout(celebrationTimer);

  const rect = source?.getBoundingClientRect?.();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.42;
  const themes = {
    kitchen: ["#f59e0b", "#ea580c", "#fef3c7", "#7c2d12"],
    ready: ["#16a34a", "#22c55e", "#dcfce7", "#14532d"],
    delivered: ["#0d9488", "#14b8a6", "#ccfbf1", "#134e4a"],
    paid: ["#1c1917", "#df835f", "#f7d6c8", "#2f6f73"],
    success: ["#16a34a", "#f59e0b", "#df835f", "#0d9488"],
  };
  const colors = themes[type] || themes.success;
  const burst = document.createElement("div");
  burst.className = `celebration-burst is-${type}`;
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;

  const ring = document.createElement("span");
  ring.className = "celebration-ring";
  burst.appendChild(ring);

  if (label) {
    const badge = document.createElement("span");
    badge.className = "celebration-badge";
    badge.textContent = label;
    burst.appendChild(badge);
  }

  if (!reducedMotion) {
    const count = type === "paid" ? 30 : 24;
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * index) / count + (index % 2 ? 0.18 : -0.12);
      const distance = 54 + (index % 6) * 10;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 18;
      particle.className = `celebration-particle ${index % 3 === 0 ? "is-square" : ""}`;
      particle.style.setProperty("--dx", `${dx.toFixed(1)}px`);
      particle.style.setProperty("--dy", `${dy.toFixed(1)}px`);
      particle.style.setProperty("--size", `${6 + (index % 4)}px`);
      particle.style.setProperty("--delay", `${(index % 5) * 18}ms`);
      particle.style.setProperty("--spin", `${index % 2 ? 140 : -120}deg`);
      particle.style.setProperty("--color", colors[index % colors.length]);
      burst.appendChild(particle);
    }
  }

  document.body.appendChild(burst);
  celebrationTimer = setTimeout(() => burst.remove(), 1300);
}

function render() {
  setTheme();
  // Sanitiza fichajes abandonados antes de pintar.
  if (autoCloseStaleShifts()) {
    persist();
  }
  if (!currentUser()) {
    app.innerHTML = renderLogin();
    syncScrollLock();
    bindLogin();
    return;
  }
  if (state.view === "printer") {
    state.view = "config";
    state.configTab = "printing";
  }
  if (["users", "recipes", "config"].includes(state.view) && !isAdminUser()) state.view = "profile";
  if (!state.view || !availableNavItems().some(([view]) => view === state.view)) state.view = "profile";

  app.innerHTML = `
    <main class="app-shell">
      ${renderHeader()}
      <section class="view">
        ${state.view === "profile" ? renderProfile() : ""}
        ${state.view === "sale" ? renderSale() : ""}
        ${state.view === "tables" ? renderTables() : ""}
        ${state.view === "kitchen" ? renderKitchen() : ""}
      ${state.view === "inventory" ? renderInventory() : ""}
      ${state.view === "recipes" ? renderRecipes() : ""}
        ${state.view === "cash" ? renderCashRegister() : ""}
        ${state.view === "config" ? renderConfig() : ""}
        ${state.view === "data" ? renderData() : ""}
        ${state.view === "users" ? renderUsers() : ""}
      </section>
      ${renderModal()}
    </main>
  `;
  syncScrollLock();
  bindEvents();
}

function syncScrollLock() {
  const shouldLock = Boolean(currentUser() && (state.modal || state.productConfig));
  const isLocked = document.body.classList.contains("modal-open");
  if (shouldLock && !isLocked) {
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    document.body.style.setProperty("--modal-scroll-y", `-${lockedScrollY}px`);
    return;
  }
  if (!shouldLock && isLocked) {
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("--modal-scroll-y");
    window.scrollTo(0, lockedScrollY);
  }
}

function availableNavItems() {
  const user = currentUser();
  const items = [["profile", "Mi perfil", "users"]];
  if (hasUserFunction(user, "mesero")) {
    items.push(["sale", "Venta", "sale"], ["tables", "Mesas", "tables"]);
  }
  if (hasUserFunction(user, "cocina")) items.push(["kitchen", "Cocina", "kitchen"]);
  if (hasCashAccess(user)) items.push(["cash", "Caja", "cash"]);
  if (isAdminUser(user)) {
    items.push(
      ["inventory", "Inventario", "inventory"],
      ["recipes", "Catalogo", "note"],
      ["data", "Datos", "data"],
      ["users", "Usuarios", "users"],
      ["config", "Config", "settings"],
    );
  }
  return items;
}

function renderLogin() {
  const restaurantName = state.settings?.restaurantName || "LibrePOS";
  return `
    <main class="login-shell">
      <section class="login-panel">
        <div class="brand-lockup login-brand">
          <div class="brand-mark"><img src="${BRAND_IMAGE}" alt="${escapeAttr(restaurantName)}" /></div>
          <div class="brand-copy">
            <h1 class="brand-title"><span>LibrePOS</span><span class="brand-badge">${escapeHtml(restaurantName)}</span><span class="version-badge">v${escapeHtml(APP_VERSION)}</span></h1>
            <p class="brand-subtitle">Acceso al punto de venta</p>
          </div>
        </div>
        <form class="login-form" data-login-form autocomplete="off">
          <label class="field">
            <span>Usuario</span>
            <input name="username" autocomplete="off" autocapitalize="none" spellcheck="false" />
          </label>
          <label class="field">
            <span>Contrasena</span>
            <input name="password" type="password" autocomplete="off" />
          </label>
          ${state.authError ? `<p class="form-error">${escapeHtml(state.authError)}</p>` : ""}
          <button class="primary-button" type="submit">${svg("check")}Entrar</button>
        </form>
      </section>
    </main>
  `;
}

function shortCommit(value) {
  return value ? String(value).slice(0, 7) : "";
}

function renderUpdateButton() {
  if (!isAdminUser()) return "";
  if (!state.updateBusy && !state.updateInfo?.available) return "";
  const title = state.updateInfo?.remoteCommit
    ? `Nueva version disponible: ${shortCommit(state.updateInfo.remoteCommit)}`
    : "Actualizar LibrePOS";
  return `
    <button class="nav-button update-nav-button ${state.updateBusy ? "is-busy" : ""}" data-apply-update ${state.updateBusy ? "disabled" : ""} title="${escapeHtml(title)}">
      ${svg("transfer")}
      <span>${state.updateBusy ? "Actualizando" : "Actualizar"}</span>
    </button>
  `;
}

function renderHeader() {
  const user = currentUser();
  const restaurantName = state.settings?.restaurantName || "LibrePOS";
  const updateButton = renderUpdateButton();
  const navEntries = [
    ...availableNavItems().map(([view, label, icon]) => ({ type: "nav", view, label, icon })),
    { type: "logout", label: "Salir", icon: "logout" },
  ];
  const pageSize = 5;
  const maxPage = Math.max(0, Math.ceil(navEntries.length / pageSize) - 1);
  state.navPage = Math.min(Math.max(Number(state.navPage) || 0, 0), maxPage);
  const visibleNavEntries = navEntries.slice(state.navPage * pageSize, state.navPage * pageSize + pageSize);
  const navButtons = visibleNavEntries
    .map((entry) => {
      if (entry.type === "logout") {
        return `<button class="nav-button logout-nav-button" data-logout title="Salir">${svg("logout")}<span>Salir</span></button>`;
      }
      return `
        <button class="nav-button ${state.view === entry.view ? "is-active" : ""}" data-nav="${entry.view}" title="${escapeAttr(entry.label)}">
          ${svg(entry.icon)}
          <span>${escapeHtml(entry.label)}</span>
        </button>
      `;
    })
    .join("");
  return `
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark"><img src="${BRAND_IMAGE}" alt="${escapeAttr(restaurantName)}" /></div>
        <div class="brand-copy">
          <h1 class="brand-title">
            <span>LibrePOS</span>
            <span class="brand-badge">${escapeHtml(restaurantName)}</span>
            <span class="version-badge">v${escapeHtml(APP_VERSION)}</span>
          </h1>
          <p class="brand-subtitle">${escapeHtml(state.settings.subtitle)} · ${escapeHtml(user.name)}</p>
        </div>
      </div>
      <nav class="topbar-actions ${updateButton ? "has-update" : ""}" aria-label="Secciones">
        ${updateButton ? `<div class="topbar-update-slot">${updateButton}</div>` : ""}
        <button class="nav-scroll-button" data-nav-scroll="-1" title="Ver anteriores" ${state.navPage <= 0 ? "disabled" : ""}>${svg("chevronLeft")}</button>
        <div class="nav-scroll-viewport" data-nav-viewport>
          <div class="nav-scroll-track">
            ${navButtons}
          </div>
        </div>
        <button class="nav-scroll-button" data-nav-scroll="1" title="Ver mas opciones" ${state.navPage >= maxPage ? "disabled" : ""}>${svg("chevronRight")}</button>
      </nav>
    </header>
  `;
}

function renderSale() {
  const activeOrder = getActiveOrder();
  if (!activeOrder) return renderSaleHome();
  const cashOpen = isCashOpen();
  return `
    <div class="quick-actions">
      <button class="secondary-button" data-open-modal="open-table" ${cashOpen ? "" : "disabled"}>${svg("table")}Nueva mesa</button>
      <button class="secondary-button" data-open-modal="takeout" ${cashOpen ? "" : "disabled"}>${svg("bag")}Para llevar</button>
      <button class="secondary-button" data-back-home>${svg("minus")}Ordenes</button>
    </div>
    ${cashOpen ? "" : renderCashClosedNotice()}
    ${renderActiveTableSwitcher(activeOrder)}
    ${renderOrderFocus(activeOrder)}
    <div class="sale-workspace is-immediate">
      ${renderTicket(activeOrder)}
      ${renderMenu(activeOrder)}
    </div>
    ${renderMobileOrderBar(activeOrder)}
  `;
}

function renderMobileOrderBar(order) {
  const totals = calculateTotals(order);
  const cashOpen = isCashOpen();
  return `
    <section class="mobile-order-bar" aria-label="Acciones rapidas de orden">
      <div>
        <strong>${money.format(totals.total)}</strong>
        <span>${totals.pending} por comandar · ${totals.ready} listas</span>
      </div>
      <div class="mobile-order-actions">
        <button class="primary-button compact" data-open-modal="command" ${totals.pending && cashOpen ? "" : "disabled"}>${svg("digital")}Comandar</button>
        <button class="secondary-button compact" data-open-modal="price">${svg("cash")}</button>
        <button class="secondary-button compact" data-finalize-order ${order.items.length ? "" : "disabled"}>${svg("check")}</button>
      </div>
    </section>
  `;
}

function renderActiveTableSwitcher(activeOrder) {
  const activeOrders = getOpenOrders().sort((a, b) => {
    if (a.type !== b.type) return a.type === "table" ? -1 : 1;
    if (a.type === "table") return Number(a.tableNumber) - Number(b.tableNumber);
    return new Date(a.openedAt) - new Date(b.openedAt);
  });
  if (!activeOrders.length) return "";
  // Si solo hay una orden activa y es justamente la que se está viendo,
  // el switcher es redundante y solo ocupa espacio.
  if (activeOrders.length === 1 && activeOrders[0].id === activeOrder?.id) return "";
  return `
    <section class="table-switcher" aria-label="Ordenes activas">
      <div class="table-switcher-head">
        <strong>${svg("tables")}Ordenes activas</strong>
        <span>${activeOrders.length}</span>
      </div>
      <div class="table-switcher-list">
        ${activeOrders
          .map((order) => {
            const totals = calculateTotals(order);
            const status = tableState(order);
            const priorityCount = totals.ready || totals.preparing || totals.waiting || totals.pending || totals.delivered || 0;
            const priorityLabel =
              totals.ready ? "listas" : totals.preparing ? "cocina" : totals.waiting ? "espera" : totals.pending ? "por cmd" : "ent.";
            return `
              <button class="table-switch-button order-type-${order.type} state-${status} ${order.id === activeOrder.id ? "is-active" : ""}" data-open-order="${order.id}">
                <span>
                  <strong>${escapeHtml(orderLabel(order))}</strong>
                  <small>${tableStateMeta[status].label} · ${elapsed(order.openedAt)}</small>
                </span>
                <span class="table-switch-meta">
                  <b>${priorityCount}</b>
                  <small>${priorityLabel}</small>
                </span>
              </button>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderSaleHome() {
  const cashOpen = isCashOpen();
  return `
    <div class="sale-home">
      ${cashOpen ? "" : renderCashClosedNotice()}
      ${renderServiceOverview()}
      <section class="action-band">
        <button class="big-action" data-open-modal="open-table" ${cashOpen ? "" : "disabled"}>
          ${svg("table", "big-icon")}
          <span>Abrir nueva mesa</span>
        </button>
        <button class="big-action" data-open-modal="takeout" ${cashOpen ? "" : "disabled"}>
          ${svg("bag", "big-icon")}
          <span>Para llevar</span>
        </button>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Ordenes abiertas</h2>
            <p class="panel-kicker">${getOpenOrders().length} activas</p>
          </div>
        </div>
        <div class="order-card-grid">
          ${
            getOpenOrders().length
              ? getOpenOrders().map(renderOrderCard).join("")
              : `<div class="empty-state">No hay mesas ni ordenes para llevar abiertas.</div>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderCashClosedNotice() {
  return `
    <section class="checkout-warning cash-closed-notice">
      ${svg("alert")}Caja cerrada. Abre caja antes de abrir mesas, para llevar o comandar productos.
    </section>
  `;
}

function renderServiceOverview() {
  const orders = getOpenOrders();
  const totals = orders.reduce(
    (acc, order) => {
      const status = tableState(order);
      acc[status] = (acc[status] || 0) + 1;
      if (order.type === "table") acc.tables += 1;
      if (order.type === "takeout") acc.takeout += 1;
      acc.revenue += calculateTotals(order).total;
      return acc;
    },
    { tables: 0, takeout: 0, ready: 0, preparing: 0, waiting: 0, ordering: 0, revenue: 0 },
  );
  return `
    <section class="service-overview" aria-label="Resumen de servicio">
      ${renderServiceCard("Abiertas", String(orders.length), `${totals.tables} mesas · ${totals.takeout} llevar`, "open")}
      ${renderServiceCard("Listas", String(totals.ready || 0), "por entregar", "ready")}
      ${renderServiceCard("En cocina", String(totals.preparing || 0), `${totals.waiting || 0} en espera`, "preparing")}
      ${renderServiceCard("Monto activo", money.format(totals.revenue), "sin cerrar", "money")}
    </section>
  `;
}

function renderServiceCard(label, value, detail, tone) {
  return `
    <article class="service-card tone-${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${detail}</small>
    </article>
  `;
}

function renderOrderFocus(order) {
  const totals = calculateTotals(order);
  const status = tableState(order);
  return `
    <section class="order-focus state-${status}">
      <div>
        <span class="order-focus-kicker">${tableStateMeta[status].label}</span>
        <h2>${escapeHtml(orderLabel(order))}</h2>
        <p>${escapeHtml(waiterName(order.waiterId))}${order.guests ? ` · ${order.guests} comensales` : ""} · ${elapsed(order.openedAt)}</p>
      </div>
      <div class="order-focus-metrics">
        <span><strong>${totals.pending}</strong>Por comandar</span>
        <span><strong>${totals.waiting + totals.preparing + totals.ready}</strong>En proceso</span>
        <span><strong>${money.format(totals.total)}</strong>Total</span>
      </div>
    </section>
  `;
}

function renderTables() {
  const openTables = tables.map((number) => ({ number, order: getTableOrder(number) }));
  const takeoutOrders = getOpenOrders()
    .filter((order) => order.type === "takeout")
    .sort((a, b) => new Date(a.openedAt) - new Date(b.openedAt));
  const tableStates = ["free", "open", "ordering", "waiting", "preparing", "ready", "served"];
  const counts = openTables.reduce(
    (acc, item) => {
      acc[tableState(item.order)] += 1;
      return acc;
    },
    Object.fromEntries(tableStates.map((stateId) => [stateId, 0])),
  );
  return `
    <div class="tables-view">
      <section class="board-header">
        <div>
          <h2>Mesas</h2>
          <p>13 mesas · vista rapida por color</p>
        </div>
        <div class="table-legend">
          ${tableStates
            .map((stateId) => `<span><i class="legend-dot ${stateId}"></i>${tableStateMeta[stateId].legend} ${counts[stateId]}</span>`)
            .join("")}
        </div>
      </section>
      ${renderTakeoutNotes(takeoutOrders)}
      <section class="tables-grid">
        ${openTables.map(({ number, order }) => renderTableTile(number, order)).join("")}
      </section>
    </div>
  `;
}

function renderTakeoutNotes(orders) {
  if (!orders.length) return "";
  return `
    <section class="takeout-notes" aria-label="Ordenes para llevar">
      <div class="takeout-notes-head">
        <strong>${svg("bag")}Para llevar activos</strong>
        <span>${orders.length}</span>
      </div>
      <div class="takeout-note-list">
        ${orders.map(renderTakeoutNoteCard).join("")}
      </div>
    </section>
  `;
}

function renderTakeoutNoteCard(order) {
  const status = tableState(order);
  const totals = calculateTotals(order);
  const readyQty = readyBatches(order).reduce((sum, batch) => sum + batchQty(batch), 0);
  return `
    <article class="takeout-note state-${status}">
      <div class="takeout-note-main">
        <div>
          <h3>${escapeHtml(orderLabel(order))}</h3>
          <p>${tableStateMeta[status].label} · ${elapsed(order.openedAt)}</p>
        </div>
        <strong>${money.format(totals.total)}</strong>
      </div>
      <div class="table-progress">
        ${renderTableProgress(totals)}
      </div>
      ${order.comments ? `<div class="table-note">${escapeHtml(order.comments)}</div>` : ""}
      ${renderOrderAlerts(order)}
      <div class="takeout-note-actions">
        ${readyQty ? `<button class="primary-button deliver-button" data-deliver-ready="${order.id}">${svg("check")}Entregar (${readyQty})</button>` : ""}
        <button class="secondary-button" data-open-order="${order.id}">${svg("sale")}Continuar</button>
        <button class="secondary-button" data-open-modal="table-note" data-order-id="${order.id}">${svg("note")}Nota</button>
        <button class="danger-button" data-close-order="${order.id}">${svg("check")}Cerrar</button>
      </div>
    </article>
  `;
}

function renderOrderAlerts(order) {
  const alerts = activeAlerts(order);
  if (!alerts.length) return "";
  return `
    <div class="order-alerts">
      ${alerts
        .map(
          (alert) => `
            <div class="order-alert tone-${alert.tone || "cancel"}">
              <span>${svg("alert")}</span>
              <p>${escapeHtml(alert.message)}<small>${elapsed(alert.createdAt)}</small></p>
              <button class="icon-button compact alert-clear" data-clear-alert="${order.id}:${alert.id}" title="Limpiar aviso">${svg("check")}</button>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTableTile(number, order) {
  const status = tableState(order);
  const label = tableStateMeta[status].label;
  const totals = order ? calculateTotals(order) : null;
  const readyCommands = order ? readyBatches(order) : [];
  const readyQty = readyCommands.reduce((sum, batch) => sum + batchQty(batch), 0);
  const cashOpen = isCashOpen();
  return `
    <article class="table-tile state-${status}">
      <div class="table-tile-head">
        <div>
          <h3>Mesa ${number}</h3>
          <p>${label}</p>
        </div>
        <span class="table-status">${label}</span>
      </div>
      ${
        order
          ? `
            <div class="table-metrics">
              <span><strong>${escapeHtml(waiterName(order.waiterId))}</strong>Mesero</span>
              <span><strong>${order.guests || 0}</strong>Comensales</span>
              <span><strong>${elapsed(order.openedAt)}</strong>Abierta</span>
              <span><strong>${money.format(totals.total)}</strong>Total</span>
            </div>
            <div class="table-progress">
              ${renderTableProgress(totals)}
              <span>${lastKitchenTime(order)}</span>
            </div>
            ${order.comments ? `<div class="table-note">${escapeHtml(order.comments)}</div>` : ""}
            ${renderOrderAlerts(order)}
            <div class="table-actions-row ${readyQty ? "has-delivery" : ""}">
              ${readyQty ? `<button class="primary-button deliver-button" data-deliver-ready="${order.id}">${svg("check")}Entregar listos (${readyQty})</button>` : ""}
              <button class="secondary-button" data-open-order="${order.id}">${svg("sale")}Continuar</button>
              <button class="secondary-button" data-print-prepaid-order="${order.id}" ${order.items.length ? "" : "disabled"}>${svg("print")}Imprimir ticket</button>
              <button class="secondary-button" data-open-modal="table-note" data-order-id="${order.id}">${svg("note")}Nota</button>
              <button class="danger-button" data-close-order="${order.id}">${svg("check")}Cerrar</button>
            </div>
          `
          : `
            <div class="table-empty-copy">Lista para abrir.</div>
            <button class="primary-button" data-open-modal="open-table" data-table-number="${number}" ${cashOpen ? "" : "disabled"}>${svg("table")}Abrir</button>
          `
      }
    </article>
  `;
}

function renderTableProgress(totals) {
  const chips = [
    ["pending", "por comandar"],
    ["waiting", "espera"],
    ["preparing", "cocina"],
    ["ready", "listas"],
    ["delivered", "entregadas"],
  ].filter(([key]) => totals[key]);
  if (!chips.length) return `<span class="status-chip open">sin productos</span>`;
  return chips.map(([key, label]) => `<span class="status-chip ${key}">${totals[key]} ${label}</span>`).join("");
}

function renderOpenTableForm() {
  const user = currentUser();
  const cashOpen = isCashOpen();
  const occupiedTables = new Set(
    getOpenOrders()
      .filter((order) => order.type === "table")
      .map((order) => Number(order.tableNumber)),
  );
  const availableTables = tables.filter((number) => !occupiedTables.has(number));
  const requestedTable = Number(state.modal?.tableNumber);
  const selectedTable = availableTables.includes(requestedTable) ? requestedTable : availableTables[0];
  const noAvailableTables = availableTables.length === 0;
  return `
    <form class="panel-body field-grid" data-open-table-form>
      ${cashOpen ? "" : renderCashClosedNotice()}
      <div class="field-row">
        <label class="field">
          <span>Numero de mesa</span>
          <select name="tableNumber" ${noAvailableTables || !cashOpen ? "disabled" : ""}>
            ${tables
              .map((number) => {
                const busy = occupiedTables.has(number);
                const selected = selectedTable === number;
                return `<option value="${number}" ${busy ? "disabled" : ""} ${selected ? "selected" : ""}>Mesa ${number}${busy ? " ocupada" : ""}</option>`;
              })
              .join("")}
          </select>
        </label>
        <label class="field">
          <span>Comensales</span>
          <input name="guests" type="number" min="1" value="2" />
        </label>
      </div>
      <label class="field">
        <span>Mesero</span>
        <select name="waiterId">
          ${availableWaiters()
            .map((item) => `<option value="${item.id}" ${item.id === user.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`)
            .join("")}
        </select>
      </label>
      <label class="field">
        <span>Comentarios opcionales</span>
        <textarea name="comments" rows="3" placeholder="Alergias, celebracion o notas de servicio"></textarea>
      </label>
      ${noAvailableTables ? `<div class="empty-state compact">No hay mesas libres para abrir.</div>` : ""}
      <button class="primary-button" type="submit" data-open-table-submit ${noAvailableTables || !cashOpen ? "disabled" : ""}>${svg("table")}Abrir mesa</button>
    </form>
  `;
}

function renderTakeoutForm() {
  const user = currentUser();
  const cashOpen = isCashOpen();
  return `
    <form class="panel-body field-grid" data-open-takeout-form>
      ${cashOpen ? "" : renderCashClosedNotice()}
      <label class="field">
        <span>Cliente (opcional — si lo dejas vacío se nombra "Mostrador")</span>
        <input name="customerName" placeholder="Ej. Juan, Mesa de pedidos" />
      </label>
      <label class="field">
        <span>Responsable</span>
        <select name="waiterId">
          ${availableWaiters()
            .map((item) => `<option value="${item.id}" ${item.id === user.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`)
            .join("")}
        </select>
      </label>
      <button class="primary-button" type="submit" ${cashOpen ? "" : "disabled"}>${svg("bag")}Abrir para llevar</button>
    </form>
  `;
}

function renderOrderCard(order) {
  const totals = calculateTotals(order);
  const status = tableState(order);
  return `
    <button class="order-card state-${status}" data-open-order="${order.id}">
      <span>
        <strong>${escapeHtml(orderLabel(order))}</strong>
        <small>${escapeHtml(waiterName(order.waiterId))}${order.guests ? ` · ${order.guests} pax` : ""}</small>
      </span>
      <span class="order-card-meta">
        <em class="order-card-status">${tableStateMeta[status].label}</em>
        <strong>${money.format(totals.total)}</strong>
        <small>${totals.pending} pendientes · ${totals.commanded} comandados · ${escapeHtml(ivaLabel(totals.ivaRate))}</small>
      </span>
    </button>
  `;
}

function renderTicket(order) {
  const totals = calculateTotals(order);
  const cashOpen = isCashOpen();
  return `
    <aside class="ticket-column">
      <section class="ticket-head">
        <button class="ghost-button compact" data-back-home>${svg("minus")}Venta</button>
        <div>
          <h2>${escapeHtml(orderLabel(order))}</h2>
          <p>${escapeHtml(waiterName(order.waiterId))}${order.guests ? ` · ${order.guests} comensales` : ""} · ${elapsed(order.openedAt)}</p>
          <span class="tax-snapshot-pill">${escapeHtml(orderTaxLabel(order))}</span>
          ${order.comments ? `<p class="ticket-comment">${escapeHtml(order.comments)}</p>` : ""}
          ${renderOrderAlerts(order)}
        </div>
        <button class="ghost-button compact" data-open-modal="table-note" data-order-id="${order.id}">${svg("note")}Nota orden</button>
      </section>
      <section class="ticket-list">
        ${
          order.items.length
            ? order.items.map((item) => renderTicketLine(item, order)).join("")
            : `<div class="ticket-empty">Elige productos del menu para iniciar la orden.</div>`
        }
      </section>
      <section class="ticket-footer">
        <div class="total-line">
          <span>Por comandar</span>
          <strong>${totals.pending} pzas</strong>
        </div>
        <div class="total-line">
          <span>En proceso/listo</span>
          <strong>${totals.waiting + totals.preparing + totals.ready} pzas</strong>
        </div>
        <div class="total-line">
          <span>Entregado</span>
          <strong>${totals.delivered} pzas</strong>
        </div>
        <div class="total-line grand">
          <span>Precio</span>
          <strong>${money.format(totals.total)}</strong>
        </div>
        <div class="total-line compact-tax-line">
          <span>Incluye ${escapeHtml(ivaLabel(totals.ivaRate))}</span>
          <strong>${money.format(totals.iva)}</strong>
        </div>
        <div class="ticket-actions">
          <button class="primary-button" data-open-modal="command" ${totals.pending && cashOpen ? "" : "disabled"}>${svg("digital")}Comandar</button>
          <button class="secondary-button" data-open-modal="price">${svg("cash")}Precio</button>
          <button class="secondary-button" data-print-prepaid-order="${order.id}" ${order.items.length ? "" : "disabled"}>${svg("print")}Imprimir ticket</button>
          <button class="secondary-button" data-finalize-order ${order.items.length ? "" : "disabled"}>${svg("check")}Finalizar</button>
        </div>
      </section>
    </aside>
  `;
}

function renderTicketLine(item, order) {
  const serviceStatus = lineServiceStatus(item, order);
  const locked = item.status !== "pending";
  const canCancelFromSale = serviceStatus === "waiting";
  // Editable mientras la comanda no haya entrado a preparación en cocina.
  const editable = lineIsEditable(order, item);
  const wasEdited = Boolean(item.editedAt);
  const parts = lineParts(item);
  const product = getProduct(item.productId);
  return `
    <article class="ticket-line is-${serviceStatus}${parts ? " is-mixto" : ""}">
      <div class="ticket-line-main">
        <div>
          <h3>${escapeHtml(item.name)}${parts ? ` <span class="mixto-badge">Mixto ×${parts.length}</span>` : ""}</h3>
          ${parts && product ? renderMixtoBreakdown(product, item) : `<p>${escapeHtml(item.optionsText || item.subsection)}</p>`}
          ${item.note ? `<p class="line-note">${escapeHtml(item.note)}</p>` : ""}
          <span class="line-status status-${serviceStatus}">${lineStatusLabel(serviceStatus)}</span>
        </div>
        <strong>${money.format(item.unitPrice * item.qty)}</strong>
      </div>
      <div class="ticket-line-controls">
        <div class="qty-control">
          <button data-line-qty="${item.id}" data-delta="-1" ${locked ? "disabled" : ""}>${svg("minus")}</button>
          <span>${item.qty}</span>
          <button data-line-qty="${item.id}" data-delta="1" ${locked ? "disabled" : ""}>${svg("plus")}</button>
        </div>
        <div class="line-action-buttons">
          ${
            editable && item.status === "commanded"
              ? `<button class="icon-button" data-edit-line="${item.id}" title="Editar antes de cocina (${wasEdited ? "ya editada" : "todavia a tiempo"})">${svg("note")}<small class="edit-line-dot${wasEdited ? " is-on" : ""}"></small></button>`
              : `<button class="icon-button" data-open-modal="line-note" data-line-id="${item.id}" title="Nota">${svg("note")}</button>`
          }
          ${
            canCancelFromSale
              ? `<button class="icon-button subtle-danger" data-open-modal="cancel-line" data-order-id="${order.id}" data-line-id="${item.id}" data-cancel-source="venta" title="Cancelar">${svg("cancel")}</button>`
              : ""
          }
          <button class="icon-button" data-remove-line="${item.id}" ${locked ? "disabled" : ""} title="Quitar">${svg("trash")}</button>
        </div>
      </div>
    </article>
  `;
}

// Detalle visual de un item mixto: muestra cada parte con su selección.
function renderMixtoBreakdown(product, item) {
  const parts = lineParts(item);
  if (!parts || !product) return "";
  const splittables = splittableOptions(product);
  const splitIds = new Set(splittables.map((opt) => opt.id));
  const partItems = parts.map((part, idx) => {
    const sel = part?.selections || {};
    const labels = splittables
      .map((option) => {
        const choice = option.choices[sel[option.id]];
        return choice ? choice.label : "—";
      })
      .join(" · ");
    return `<li><strong>${idx + 1}.</strong> ${escapeHtml(labels)}</li>`;
  });
  const commonLabels = [];
  (product.options || []).forEach((option) => {
    if (splitIds.has(option.id)) return;
    if (option.type === "single") {
      const choice = option.choices[item.selections?.[option.id]];
      if (choice) commonLabels.push(`${option.label}: ${choice.label}`);
    } else if (option.type === "multi") {
      const selected = item.selections?.[option.id];
      if (Array.isArray(selected) && selected.length) {
        const labels = selected.map((i) => option.choices[i]?.label).filter(Boolean);
        if (labels.length) commonLabels.push(`${option.label}: ${labels.join(", ")}`);
      }
    }
  });
  return `
    <div class="mixto-detail">
      <ul class="mixto-parts">${partItems.join("")}</ul>
      ${commonLabels.length ? `<p class="mixto-common">${escapeHtml(commonLabels.join(" · "))}</p>` : ""}
    </div>
  `;
}

function renderCommandOptions(order) {
  const pending = order.items.filter((item) => item.status === "pending");
  const cashOpen = isCashOpen();
  return `
    <div class="command-box">
      ${cashOpen ? "" : renderCashClosedNotice()}
      <p class="mini-title">Enviar ${pending.length} linea${pending.length === 1 ? "" : "s"}</p>
      <div class="command-grid">
        <button class="command-option" data-command-mode="digital-print" ${cashOpen ? "" : "disabled"}>${svg("print")}Digital + impresa</button>
        <button class="command-option" data-command-mode="digital" ${cashOpen ? "" : "disabled"}>${svg("digital")}Digital</button>
      </div>
    </div>
  `;
}

function renderMenu(order) {
  const activeSubsections = subsectionsFor(state.activeSection);
  const query = normalize(state.productSearch);
  const catalog = activeMenuProducts();
  const products = catalog.filter((item) => {
    const inSection = item.section === state.activeSection;
    const inSubsection = state.activeSubsection === "Todos" || item.subsection === state.activeSubsection;
    const text = normalize(`${item.name} ${item.description} ${item.section} ${item.subsection}`);
    return inSection && inSubsection && text.includes(query);
  });

  return `
    <section class="menu-column">
      <div class="menu-head">
        <div>
          <h2>Menu</h2>
          <p>${escapeHtml(state.activeSection)} · ${products.length} productos</p>
        </div>
        <span>${escapeHtml(orderLabel(order))} · ${escapeHtml(orderTaxLabel(order))}</span>
      </div>
      <div class="menu-toolbar">
        <div class="search-wrap">
          ${svg("search")}
          <input class="search-input" data-search value="${escapeAttr(state.productSearch)}" placeholder="Buscar en el menu" />
        </div>
      </div>
      <div class="mobile-menu-filters" aria-label="Filtros de menu movil">
        <label class="mobile-filter-field">
          <span>Categoria</span>
          <select data-mobile-section>
            ${sections()
              .map(
                (section) => `
                  <option value="${escapeAttr(section)}" ${state.activeSection === section ? "selected" : ""}>
                    ${escapeHtml(section)} (${catalog.filter((item) => item.section === section).length})
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>
        <label class="mobile-filter-field">
          <span>Subcategoria</span>
          <select data-mobile-subsection>
            ${activeSubsections
              .map(
                (subsection) => `
                  <option value="${escapeAttr(subsection)}" ${state.activeSubsection === subsection ? "selected" : ""}>
                    ${escapeHtml(subsection)}
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>
      </div>
      <div class="section-tabs">
        ${sections()
          .map(
            (section) => `
              <button class="section-tab ${state.activeSection === section ? "is-active" : ""}" data-section="${escapeAttr(section)}">
                ${escapeHtml(section)}
                <small>${catalog.filter((item) => item.section === section).length}</small>
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="chip-row">
        ${activeSubsections
          .map(
            (subsection) => `
              <button class="chip ${state.activeSubsection === subsection ? "is-active" : ""}" data-subsection="${escapeAttr(subsection)}">
                ${escapeHtml(subsection)}
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="menu-grid">
        ${
          products.length
            ? products.map((item) => renderMenuItem(item, order)).join("")
            : `<div class="empty-state">No hay productos en esta combinacion.</div>`
        }
      </div>
    </section>
  `;
}

function renderMenuItem(item, order = null) {
  const hasOptions = item.options.length > 0;
  const stock = estimateProductStock(item, defaultSelectionsFor(item));
  const tax = order ? taxBreakdownForOrder(order, item.price) : taxBreakdownForGross(item.price);
  return `
    <button class="menu-item" data-configure-product="${item.id}">
      <span class="menu-item-top">
        <span class="menu-icon">${svg(item.icon)}</span>
        <span class="price-with-tax"><strong>${money.format(item.price)}</strong><small>IVA ${money.format(tax.iva)}</small></span>
      </span>
      <span>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </span>
      <span class="menu-meta">
        <span>${escapeHtml(item.subsection)}</span>
        <span>${hasOptions ? "Variantes" : "Directo"}</span>
        ${renderStockPill(stock)}
      </span>
    </button>
  `;
}

function renderOrderSidePanel(order) {
  return `
    <aside class="side-column">
      ${state.productConfig ? renderProductConfig() : renderOrderContext(order)}
    </aside>
  `;
}

// El modal de configuración puede vivir o bien dentro de la sidebar de venta
// (.side-column) o como modal flotante (.modal-card). Esta función localiza
// el panel correcto donde está renderizado para actualizarlo en sitio.
function getProductConfigHost() {
  return (
    document.querySelector(".modal-card .detail-panel")?.parentElement ||
    document.querySelector(".side-column .detail-panel")?.parentElement ||
    document.querySelector(".modal-card") ||
    document.querySelector(".side-column")
  );
}

// Aplica el cambio de una selección (single o multi) sin tocar la estructura
// del modal: solo cambia clases, badges de stock, precio y panel de stock.
// El resto del modal (nota, extras, controles de qty, toggle Mixto) sigue
// intacto en el DOM y NO hay parpadeo perceptible.
function applySelectionUpdateInPlace() {
  if (!state.productConfig) return;
  const product = getProduct(state.productConfig.productId);
  const order = getActiveOrder();
  const side = getProductConfigHost();
  if (!product || !side) return;
  const extras = normalizeExtras(state.productConfig.extras);
  const isMixto = Array.isArray(state.productConfig.parts) && state.productConfig.parts.length >= 2;
  const fakeLine = {
    productId: product.id,
    selections: state.productConfig.selections,
    parts: isMixto ? state.productConfig.parts : null,
    qty: state.productConfig.qty,
    extras,
  };
  const price = combinedUnitPrice(product, fakeLine, extras);
  const total = price * state.productConfig.qty;
  const stock = estimateProductStock(
    product,
    state.productConfig.selections,
    extras,
    isMixto ? state.productConfig.parts : null,
  );
  const canServe = lineHasAvailableParts(product, fakeLine);

  // 1. Toggle is-active de TODOS los option-pill (single) según la selección
  //    actual en el scope correspondiente (común o parte).
  side.querySelectorAll("[data-select-option]").forEach((pill) => {
    const optionId = pill.dataset.selectOption;
    const choiceIdx = Number(pill.dataset.choiceIndex);
    const partAttr = pill.dataset.partIndex;
    const isPart = partAttr !== undefined && partAttr !== "";
    let currentSelection;
    if (isPart) {
      currentSelection = state.productConfig.parts?.[Number(partAttr)]?.selections?.[optionId];
    } else {
      currentSelection = state.productConfig.selections?.[optionId];
    }
    pill.classList.toggle("is-active", currentSelection === choiceIdx);
  });

  // 2. Toggle is-active de option-pill multi (no usan part-index)
  side.querySelectorAll("[data-toggle-option]").forEach((pill) => {
    const optionId = pill.dataset.toggleOption;
    const choiceIdx = Number(pill.dataset.choiceIndex);
    const currentList = state.productConfig.selections?.[optionId];
    const active = Array.isArray(currentList) && currentList.includes(choiceIdx);
    pill.classList.toggle("is-active", active);
  });

  // 3. Actualizar badges de stock (~N) de cada pill: cambia con la selección.
  side.querySelectorAll(".option-pill[data-select-option], .option-pill[data-toggle-option]").forEach((pill) => {
    const optionId = pill.dataset.selectOption || pill.dataset.toggleOption;
    const opt = product.options.find((o) => o.id === optionId);
    if (!opt) return;
    const choiceIndex = Number(pill.dataset.choiceIndex);
    const partAttr = pill.dataset.partIndex;
    const scope = partAttr !== undefined && partAttr !== "" ? { partIndex: Number(partAttr) } : null;
    const newBadgeHtml = renderVariantStockBadge(product, opt, choiceIndex, scope);
    const existingBadge = pill.querySelector(".variant-stock");
    if (newBadgeHtml) {
      const tmp = document.createElement("span");
      tmp.innerHTML = newBadgeHtml.trim();
      const fresh = tmp.firstElementChild;
      if (existingBadge && fresh) {
        existingBadge.className = fresh.className;
        existingBadge.textContent = fresh.textContent;
      } else if (fresh) {
        pill.appendChild(fresh);
      }
    } else if (existingBadge) {
      existingBadge.remove();
    }
  });

  // 4. Precio y total
  const totalEl = side.querySelector("[data-config-total]");
  const unitEl = side.querySelector("[data-config-unit]");
  const taxEl = side.querySelector("[data-config-tax]");
  if (totalEl) totalEl.textContent = money.format(total);
  if (unitEl) unitEl.textContent = `${money.format(price)} c/u`;
  if (taxEl) {
    const tax = order ? taxBreakdownForOrder(order, total) : taxBreakdownForGross(total);
    taxEl.textContent = `Incluye ${ivaLabel(tax.ivaRate)} ${money.format(tax.iva)}`;
  }

  // 5. Stock-panel completo (sin animación porque ya la quitamos)
  const stockHost = side.querySelector("[data-config-stock-panel]");
  if (stockHost) stockHost.innerHTML = renderProductStockPanel(stock, state.productConfig.qty);

  // 6. Habilitar / deshabilitar Agregar al ticket
  const addBtn = side.querySelector("[data-add-configured]");
  if (addBtn) addBtn.disabled = !canServe;
}

// Refresca el panel de configuración del producto sin re-pintar toda la app.
// Preserva scroll position y foco de inputs para que no se sienta como
// una recarga al pulsar opciones, extras o cambiar partes en Mixto.
function refreshProductConfig() {
  if (!state.productConfig) {
    render();
    return;
  }
  const host = getProductConfigHost();
  if (!host) {
    render();
    return;
  }
  // Captura scroll, scroll del modal y foco para restaurarlos tras reemplazar.
  const panelBody = host.querySelector(".panel-body");
  const prevPanelScroll = panelBody?.scrollTop || 0;
  const prevHostScroll = host.scrollTop || 0;
  const prevPageScroll = window.scrollY || 0;
  const active = document.activeElement;
  let focusInfo = null;
  if (active && host.contains(active)) {
    if (active.matches("[data-config-note], [data-extra-id]")) {
      focusInfo = {
        selector: active.matches("[data-config-note]")
          ? "[data-config-note]"
          : "[data-extra-id]",
        selStart: active.selectionStart,
        selEnd: active.selectionEnd,
      };
    }
  }
  host.innerHTML = renderProductConfig();
  bindProductConfigEvents();
  const nextPanelBody = host.querySelector(".panel-body");
  if (nextPanelBody && prevPanelScroll) nextPanelBody.scrollTop = prevPanelScroll;
  if (prevHostScroll) host.scrollTop = prevHostScroll;
  if (prevPageScroll) window.scrollTo({ top: prevPageScroll, behavior: "instant" });
  if (focusInfo) {
    const target = host.querySelector(focusInfo.selector);
    if (target) {
      target.focus({ preventScroll: true });
      if (focusInfo.selStart !== null && typeof target.setSelectionRange === "function") {
        try {
          target.setSelectionRange(focusInfo.selStart, focusInfo.selEnd ?? focusInfo.selStart);
        } catch {}
      }
    }
  }
}

// Registra los listeners específicos del modal de configuración.
// Se usa tanto desde bindEvents() (render completo) como desde
// refreshProductConfig() (render in-place).
function bindProductConfigEvents() {
  document.querySelectorAll("[data-select-option]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.productConfig) return;
      const optionId = button.dataset.selectOption;
      const choiceIdx = Number(button.dataset.choiceIndex);
      const partAttr = button.dataset.partIndex;
      if (partAttr !== undefined && partAttr !== "" && Array.isArray(state.productConfig.parts)) {
        const partIdx = Number(partAttr);
        if (state.productConfig.parts[partIdx]) {
          state.productConfig.parts[partIdx].selections = {
            ...(state.productConfig.parts[partIdx].selections || {}),
            [optionId]: choiceIdx,
          };
        }
      } else {
        state.productConfig.selections[optionId] = choiceIdx;
      }
      persist();
      // Cambio puntual: no re-renderiza el modal, sólo actualiza clases,
      // badges, precio y panel de stock. Sin parpadeo perceptible.
      applySelectionUpdateInPlace();
    });
  });
  document.querySelectorAll("[data-toggle-option]").forEach((button) => {
    button.addEventListener("click", () => toggleMultiOption(button.dataset.toggleOption, Number(button.dataset.choiceIndex)));
  });
  document.querySelector("[data-split-toggle]")?.addEventListener("change", (event) => {
    toggleSplitMode(Boolean(event.target.checked));
  });
  document.querySelectorAll("[data-split-parts]").forEach((button) => {
    button.addEventListener("click", () => setSplitPartsCount(Number(button.dataset.splitParts)));
  });
  document.querySelectorAll("[data-config-qty]").forEach((button) => {
    button.addEventListener("click", () => updateConfigQty(Number(button.dataset.configQty)));
  });
  document.querySelector("[data-config-note]")?.addEventListener("input", (event) => {
    state.productConfig.note = event.target.value;
    persist();
  });
  document.querySelector("[data-extra-add]")?.addEventListener("click", addProductExtra);
  document.querySelectorAll("[data-extra-remove]").forEach((button) => {
    button.addEventListener("click", () => removeProductExtra(Number(button.dataset.extraRemove)));
  });
  document.querySelector("[data-add-configured]")?.addEventListener("click", addConfiguredProduct);
  document.querySelector("[data-close-config]")?.addEventListener("click", closeProductConfig);
}

function renderProductConfig() {
  const product = getProduct(state.productConfig.productId);
  if (!product) return "";
  const order = getActiveOrder();
  const extras = normalizeExtras(state.productConfig.extras);
  const isMixto = Array.isArray(state.productConfig.parts) && state.productConfig.parts.length >= 2;
  const fakeLine = {
    productId: product.id,
    selections: state.productConfig.selections,
    parts: isMixto ? state.productConfig.parts : null,
    qty: state.productConfig.qty,
    extras,
  };
  const price = combinedUnitPrice(product, fakeLine, extras);
  const total = price * state.productConfig.qty;
  const tax = order ? taxBreakdownForOrder(order, total) : taxBreakdownForGross(total);
  const stock = estimateProductStock(product, state.productConfig.selections, extras, isMixto ? state.productConfig.parts : null);
  const canServe = lineHasAvailableParts(product, fakeLine);
  const splittable = productIsSplittable(product);
  const maxParts = splitMaxParts(product);
  const splitIds = new Set(splittableOptions(product).map((opt) => opt.id));
  const commonOptions = (product.options || []).filter(
    (option) => !isMixto || !splitIds.has(option.id),
  );
  const isEditing = Boolean(state.productConfig.editingLineId);
  const submitLabel = isEditing ? "Guardar cambios" : "Agregar al ticket";
  const submitIcon = isEditing ? "check" : "plus";
  return `
    <section class="panel detail-panel${isEditing ? " is-editing" : ""}">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">${escapeHtml(product.name)}${isMixto ? ` <span class="mixto-title-badge">Mixto ×${state.productConfig.parts.length}</span>` : ""}${isEditing ? ` <span class="editing-title-badge">Editando</span>` : ""}</h2>
          <p class="panel-kicker">${isEditing ? "La cocina recibirá un aviso visual con el cambio." : `${escapeHtml(product.section)} · ${escapeHtml(product.subsection)}`}</p>
        </div>
        <button class="icon-button" data-close-config title="Cerrar">${svg("minus")}</button>
      </div>
      <div class="panel-body field-grid">
        <p class="detail-description">${escapeHtml(product.description)}</p>
        ${splittable ? renderSplitToggle(product, isMixto, maxParts) : ""}
        ${isMixto ? renderSplitParts(product) : ""}
        ${commonOptions.length && isMixto ? `<p class="mini-title">Comun para todas las partes</p>` : ""}
        ${commonOptions.map((option) => renderOptionGroup(product, option)).join("")}
        ${renderExtrasEditor(extras)}
        <div data-config-stock-panel>
          ${renderProductStockPanel(stock, state.productConfig.qty)}
        </div>
        <label class="field">
          <span>Nota para cocina</span>
          <textarea data-config-note rows="3" placeholder="Ej. sin azucar, poco hielo, alergia">${escapeHtml(state.productConfig.note || "")}</textarea>
        </label>
        <div class="config-footer">
          <div class="qty-control large">
            <button data-config-qty="-1">${svg("minus")}</button>
            <span data-config-qty-value>${state.productConfig.qty}</span>
            <button data-config-qty="1">${svg("plus")}</button>
          </div>
          <div class="config-price">
            <span>Precio</span>
            <strong data-config-total>${money.format(total)}</strong>
            <small data-config-unit>${money.format(price)} c/u</small>
            <small data-config-tax>Incluye ${escapeHtml(ivaLabel(tax.ivaRate))} ${money.format(tax.iva)}</small>
          </div>
        </div>
        <button class="primary-button" data-add-configured ${canServe ? "" : "disabled"}>${svg(submitIcon)}${submitLabel}</button>
      </div>
    </section>
  `;
}

function renderSplitToggle(product, isMixto, maxParts) {
  const partsCount = isMixto ? state.productConfig.parts.length : 2;
  const partOptions = [];
  for (let n = 2; n <= maxParts; n += 1) {
    partOptions.push(`
      <button
        class="split-parts-pill ${isMixto && partsCount === n ? "is-active" : ""}"
        data-split-parts="${n}"
        type="button"
        ${isMixto ? "" : "disabled"}
      >${n} partes</button>
    `);
  }
  return `
    <section class="split-toggle ${isMixto ? "is-active" : ""}">
      <label class="split-toggle-row">
        <span class="split-toggle-label">
          ${svg("transfer")}
          <strong>Mixto</strong>
          <small>Divide el platillo en partes con distintas selecciones</small>
        </span>
        <input type="checkbox" data-split-toggle ${isMixto ? "checked" : ""} />
      </label>
      <div class="split-parts-row">
        ${partOptions.join("")}
      </div>
    </section>
  `;
}

function renderSplitParts(product) {
  const parts = state.productConfig.parts || [];
  const splittables = splittableOptions(product);
  const weightLabel = (idx) => {
    const fraction = `1/${parts.length}`;
    return parts.length === 2 ? (idx === 0 ? "½ (mitad 1)" : "½ (mitad 2)") : `${fraction} (parte ${idx + 1})`;
  };
  return `
    <div class="split-parts">
      ${parts
        .map(
          (_, idx) => `
            <article class="split-part-card">
              <header class="split-part-head">
                <strong>Parte ${idx + 1}</strong>
                <span>${weightLabel(idx)}</span>
              </header>
              ${splittables
                .map((option) => renderOptionGroup(product, option, { partIndex: idx }))
                .join("")}
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderExtrasEditor(extras = []) {
  const catalog = [...activeExtras()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const extrasTotal = extraUnitTotal(extras);
  return `
    <details class="extras-editor" ${extras.length ? "open" : ""}>
      <summary>
        <span>${svg("plus")}Extras</span>
        <strong>${extras.length ? `+${money.format(extrasTotal)}` : "Opcional"}</strong>
      </summary>
      <div class="extras-body">
        <div class="extras-add-row">
          <label class="field">
            <span>Extra</span>
            <select data-extra-id ${catalog.length ? "" : "disabled"}>
              ${catalog
                .map((extra) => {
                  const item = extraInventoryItem(extra);
                  return `
                    <option value="${extra.id}">
                      ${escapeHtml(extra.name)} · +${money.format(extra.price)} · descuenta ${formatNumber(extra.qty)} ${escapeHtml(item?.unit || extra.unit)}
                    </option>
                  `;
                })
                .join("")}
            </select>
          </label>
          <button class="secondary-button compact" data-extra-add type="button" ${catalog.length ? "" : "disabled"}>
            ${svg("plus")}Agregar
          </button>
        </div>
        ${catalog.length ? "" : `<p class="muted-text compact-text">Define extras desde Catalogo > Extras para poder agregarlos aqui.</p>`}
        ${
          extras.length
            ? `
              <div class="extra-list">
                ${extras
                  .map(
                    (extra, index) => `
                      <div class="extra-row">
                        <span>
                          <strong>${escapeHtml(extra.name)}${extra.count > 1 ? ` x${formatNumber(extra.count)}` : ""}</strong>
                          <small>Descuenta ${formatNumber(extra.qty)} ${escapeHtml(extra.unit)} · +${money.format(extra.total)}</small>
                        </span>
                        <button class="icon-button compact" data-extra-remove="${index}" title="Quitar extra" type="button">${svg("trash")}</button>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            `
            : `<p class="muted-text compact-text">Sin extras agregados.</p>`
        }
      </div>
    </details>
  `;
}

function renderOptionGroup(product, option, scope = null) {
  // scope = null → opción común (state.productConfig.selections)
  // scope = { partIndex: i } → opción dentro de la parte i de productConfig.parts
  const isPart = scope && Number.isInteger(scope.partIndex);
  const selectionStore = isPart
    ? state.productConfig.parts?.[scope.partIndex]?.selections || {}
    : state.productConfig.selections || {};
  const selected = selectionStore[option.id];
  const choices = activeChoiceEntries(option);
  const partAttr = isPart ? ` data-part-index="${scope.partIndex}"` : "";
  if (option.type === "multi") {
    // Las opciones multi sólo se manejan a nivel común (no se dividen).
    const values = Array.isArray(selected) ? selected : [];
    return `
      <fieldset class="option-group">
        <legend>${escapeHtml(option.label)}</legend>
        ${
          choices.length
            ? choices
                .map(
                  ({ choice, index }) => `
              <button class="option-pill ${values.includes(index) ? "is-active" : ""}" data-toggle-option="${option.id}" data-choice-index="${index}" type="button">
                <span>${escapeHtml(choice.label)}</span>
                ${choice.priceDelta ? `<strong>+${money.format(choice.priceDelta)}</strong>` : ""}
                ${renderVariantStockBadge(product, option, index)}
              </button>
            `,
                )
                .join("")
            : `<p class="muted-text compact-text">Sin variantes activas.</p>`
        }
      </fieldset>
    `;
  }
  return `
    <fieldset class="option-group">
      <legend>${escapeHtml(option.label)}</legend>
      ${
        choices.length
          ? choices
              .map(
                ({ choice, index }) => `
            <button class="option-pill ${selected === index ? "is-active" : ""}" data-select-option="${option.id}" data-choice-index="${index}"${partAttr} type="button">
              <span>${escapeHtml(choice.label)}</span>
              ${choice.price ? `<strong>${money.format(choice.price)}</strong>` : ""}
              ${renderVariantStockBadge(product, option, index, scope)}
            </button>
          `,
              )
              .join("")
          : `<p class="muted-text compact-text">Sin variantes activas.</p>`
      }
    </fieldset>
  `;
}

function renderVariantStockBadge(product, option, index, scope = null) {
  if (!state.productConfig || !variantAffectsInventory(product, option.id)) return "";
  // Cuando estamos previsualizando dentro de una "parte" del mixto, ajustamos
  // solo esa parte para que la badge refleje el stock realmente disponible.
  const isPart = scope && Number.isInteger(scope.partIndex);
  if (isPart) {
    const parts = (state.productConfig.parts || []).map((part) => ({
      ...part,
      selections: { ...(part?.selections || {}) },
    }));
    if (!parts[scope.partIndex]) return "";
    parts[scope.partIndex].selections[option.id] = index;
    const stock = estimateProductStock(product, state.productConfig.selections, state.productConfig.extras, parts);
    if (!stock.known) return "";
    return `<small class="variant-stock ${stock.tone}">~${stock.orderable}</small>`;
  }
  const selections = structuredClone(state.productConfig.selections);
  selections[option.id] = option.type === "multi" ? toggleSelectionPreview(selections[option.id], index) : index;
  const stock = estimateProductStock(product, selections, state.productConfig.extras, state.productConfig.parts);
  if (!stock.known) return "";
  return `<small class="variant-stock ${stock.tone}">~${stock.orderable}</small>`;
}

function toggleSelectionPreview(selected, index) {
  const values = Array.isArray(selected) ? selected : [];
  return values.includes(index) ? values.filter((item) => item !== index) : [...values, index];
}

function variantAffectsInventory(product, optionId) {
  if (normalizeVariantRecipes(product.variantRecipes).some((variant) => variant.optionId === optionId)) return true;
  const variantOptions = {
    "empanadas-fritas": ["relleno"],
    "bocoles-maiz": ["relleno"],
    "bocoles-harina": ["proteina"],
    tamales: ["sabor"],
    "empanadas-harina": ["relleno"],
    molotes: ["relleno", "masa"],
    enchiladas: ["proteina", "salsa"],
    "enchiladas-chile-seco": ["proteina", "salsa"],
    estrujadas: ["proteina"],
  };
  return Boolean(variantOptions[product.id]?.includes(optionId));
}

function renderStockPill(stock) {
  if (!stock.known || stock.tone === "ok") return "";
  const labels = {
    low: "Inventario bajo",
    critical: "Inventario critico",
    zero: "Sin inventario",
  };
  return `
    <span class="stock-alert ${stock.tone}" title="${labels[stock.tone]}" aria-label="${labels[stock.tone]}">
      ${svg("alert")}
    </span>
  `;
}

function renderProductStockPanel(stock, requestedQty) {
  if (!stock.known) {
    return `
      <section class="stock-panel unknown" data-stock-panel>
        <div class="stock-panel-head">
          <span>${svg("inventory")}Inventario estimado</span>
          <strong>Sin receta</strong>
        </div>
        <p data-stock-message>No hay insumos ligados a este producto. Se puede vender, pero no hay alerta automatica.</p>
      </section>
    `;
  }
  const tightItems = stock.items.slice(0, 4);
  const overRequest = requestedQty > stock.orderable;
  return `
    <section class="stock-panel ${stock.tone} ${overRequest ? "over-request" : ""}" data-stock-panel>
      <div class="stock-panel-head">
        <span>${svg("inventory")}Inventario estimado</span>
        <strong>~${stock.orderable} orden${stock.orderable === 1 ? "" : "es"}</strong>
      </div>
      <p data-stock-message>${escapeHtml(productStockMessage(stock, requestedQty))}</p>
      <div class="stock-lines">
        ${tightItems
          .map(
            (item) => `
              <div class="stock-line ${item.portions <= 5 ? "is-tight" : ""}">
                <span>
                  <strong>${escapeHtml(item.name)}</strong>
                  <small>${formatNumber(item.availableQty)} ${escapeHtml(item.unit)} disp. · ${formatNumber(item.requiredQty)} por orden</small>
                </span>
                <b>${item.portions}</b>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function productStockMessage(stock, requestedQty) {
  if (!stock.known) return "No hay insumos ligados a este producto. Se puede vender, pero no hay alerta automatica.";
  if (requestedQty > stock.orderable) {
    return `Alerta: estas capturando ${requestedQty}, pero el inventario sugiere hasta ${stock.orderable}.`;
  }
  if (stock.tone === "critical") return "Inventario critico. Conviene confirmar antes de prometer mas ordenes.";
  if (stock.tone === "low") return "Inventario bajo. Todavia se puede vender, pero hay que estar atentos.";
  return "Calculado con insumos disponibles menos tickets pendientes sin comandar.";
}

function renderOrderContext(order) {
  return `
    <section class="panel detail-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Orden abierta</h2>
          <p class="panel-kicker">${escapeHtml(orderLabel(order))}</p>
        </div>
      </div>
      <div class="panel-body field-grid">
        <div class="context-grid">
          <span><strong>Mesero</strong>${escapeHtml(waiterName(order.waiterId))}</span>
          <span><strong>Inicio</strong>${formatTime(order.openedAt)}</span>
          ${order.guests ? `<span><strong>Comensales</strong>${order.guests}</span>` : ""}
          <span><strong>Comandas</strong>${order.commandBatches.length}</span>
          <span><strong>IVA orden</strong>${escapeHtml(orderTaxLabel(order))}</span>
        </div>
        <div class="command-history">
          <h3 class="mini-title">Comandas digitales</h3>
          ${
            order.commandBatches.length
              ? order.commandBatches
                  .map(
                    (batch) => `
                      <article class="history-row">
                        <span>${svg("digital")}</span>
                        <div>
                          <strong>${formatTime(batch.createdAt)}</strong>
                          <p>${batch.lines.reduce((sum, line) => sum + line.qty, 0)} piezas · ${escapeHtml(waiterName(batch.createdBy))}</p>
                        </div>
                      </article>
                    `,
                  )
                  .join("")
              : `<p class="muted-text">Todavia no se ha comandado nada.</p>`
          }
        </div>
      </div>
    </section>
  `;
}

function renderModal() {
  if (state.productConfig) {
    return `
      <div class="modal-backdrop" data-close-modal>
        <div class="modal-card" data-modal-card>
          ${renderProductConfig()}
        </div>
      </div>
    `;
  }
  if (!state.modal) return "";
  const order = getActiveOrder();
  const modalOrder = getOrder(state.modal.orderId) || order;
  const lineTarget = state.modal.lineId ? findLine(state.modal.lineId) : null;
  const saleTarget = state.modal.saleId ? state.sales.find((sale) => sale.id === state.modal.saleId) : null;
  const productTarget = state.modal.productId ? getProduct(state.modal.productId) : null;
  const ingredientTarget = state.modal.ingredientId ? currentInventory().find((item) => item.id === state.modal.ingredientId) : null;
  const extraTarget = state.modal.extraId ? getExtraDefinition(state.modal.extraId) : null;
  const modalContent = {
    "open-table": renderOpenTableModal(),
    takeout: renderTakeoutModal(),
    "new-user": isAdminUser() ? renderCreateUserModal() : "",
    "edit-user": isAdminUser() ? renderEditUserModal(state.modal.userId) : "",
    "new-product": isAdminUser() ? renderMenuProductModal() : "",
    "edit-product": isAdminUser() && productTarget ? renderMenuProductModal(productTarget) : "",
    "new-ingredient-category": isAdminUser() ? renderIngredientCategoryModal() : "",
    "new-ingredient": isAdminUser() ? renderIngredientModal(null, state.modal.ingredientCategory) : "",
    "edit-ingredient": isAdminUser() && ingredientTarget ? renderIngredientModal(ingredientTarget) : "",
    "new-extra": isAdminUser() ? renderExtraModal() : "",
    "edit-extra": isAdminUser() && extraTarget ? renderExtraModal(extraTarget) : "",
    "reset-folios": isAdminUser() ? renderResetFoliosModal() : "",
    "iva-price-conversion": isAdminUser() ? renderIvaPriceConversionModal(state.modal) : "",
    command: order ? renderCommandModal(order) : "",
    price: order ? renderPriceModal(order) : "",
    checkout: modalOrder ? renderCheckoutModal(modalOrder) : "",
    "cancel-order": modalOrder ? renderCancelOrderModal(modalOrder) : "",
    "cancel-line": lineTarget ? renderCancelLineModal(lineTarget.order, lineTarget.line, state.modal) : "",
    "table-note": modalOrder ? renderTableNoteModal(modalOrder) : "",
    "line-note": lineTarget ? renderLineNoteModal(lineTarget.order, lineTarget.line) : "",
    "adjust-tip": saleTarget ? renderAdjustTipModal(saleTarget) : "",
    "sale-detail": saleTarget ? renderSaleDetailModal(saleTarget) : "",
  }[state.modal.type] || "";
  if (!modalContent) return "";
  return `
    <div class="modal-backdrop" data-close-modal>
      <div class="modal-card ${state.modal.type === "sale-detail" ? "wide-modal-card" : ""}" data-modal-card>
        ${modalContent}
      </div>
    </div>
  `;
}

function renderOpenTableModal() {
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Abrir nueva mesa</h2>
          <p class="panel-kicker">Mesa, comensales y mesero responsable</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      ${renderOpenTableForm()}
    </section>
  `;
}

function renderTakeoutModal() {
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Para llevar</h2>
          <p class="panel-kicker">Orden rapida sin numero de mesa</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      ${renderTakeoutForm()}
    </section>
  `;
}

function renderCreateUserModal() {
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Nuevo usuario</h2>
          <p class="panel-kicker">Acceso y funciones dentro del POS</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-user-form>
        <label class="field">
          <span>Nombre</span>
          <input name="name" placeholder="Nombre del usuario" required />
        </label>
        <div class="field-row">
          <label class="field">
            <span>Usuario</span>
            <input name="username" placeholder="usuario o nombre con espacios" required />
          </label>
          <label class="field">
            <span>Contrasena inicial</span>
            <input name="password" type="password" placeholder="1234" required />
          </label>
        </div>
        ${renderFunctionChoices(["mesero"])}
        <button class="primary-button" type="submit">${svg("plus")}Crear usuario</button>
      </form>
    </section>
  `;
}

function renderEditUserModal(userId) {
  const user = state.users.find((item) => item.id === userId && item.active);
  if (!user) return "";
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Editar usuario</h2>
          <p class="panel-kicker">${escapeHtml(user.name)} · ${escapeHtml(user.username)}</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-edit-user-form data-user-id="${user.id}">
        <label class="field">
          <span>Nombre</span>
          <input name="name" value="${escapeAttr(user.name || "")}" placeholder="Nombre del usuario" required />
        </label>
        <label class="field">
          <span>Usuario</span>
          <input name="username" value="${escapeAttr(user.username || "")}" placeholder="usuario o nombre con espacios" required />
        </label>
        ${renderFunctionChoices(normalizeUserFunctions(user))}
        <button class="primary-button" type="submit">${svg("check")}Guardar cambios</button>
      </form>
    </section>
  `;
}

function renderTableNoteModal(order) {
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Nota de ${escapeHtml(orderLabel(order))}</h2>
          <p class="panel-kicker">Visible para el equipo durante el servicio</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-table-note-form data-order-id="${order.id}">
        <label class="field">
          <span>Nota de orden</span>
          <textarea name="comments" rows="4" placeholder="Alergias, celebracion, instrucciones de servicio">${escapeHtml(order.comments || "")}</textarea>
        </label>
        <button class="primary-button" type="submit">${svg("note")}Guardar nota</button>
      </form>
    </section>
  `;
}

function renderLineNoteModal(order, line) {
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Nota de producto</h2>
          <p class="panel-kicker">${escapeHtml(orderLabel(order))} · ${escapeHtml(line.name)}</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-line-note-form data-line-id="${line.id}">
        <label class="field">
          <span>Nota para cocina</span>
          <textarea name="note" rows="4" placeholder="Ej. sin azucar, sin cebolla, termino medio">${escapeHtml(line.note || "")}</textarea>
        </label>
        <button class="primary-button" type="submit">${svg("note")}Guardar nota</button>
      </form>
    </section>
  `;
}

function renderCommandModal(order) {
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Comandar</h2>
          <p class="panel-kicker">${escapeHtml(orderLabel(order))} · ${calculateTotals(order).pending} piezas pendientes</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <div class="panel-body">
        ${renderCommandOptions(order)}
      </div>
    </section>
  `;
}

function renderPriceModal(order) {
  const totals = calculateTotals(order);
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Precio</h2>
          <p class="panel-kicker">${escapeHtml(orderLabel(order))}</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <div class="panel-body field-grid">
        ${order.items
          .map(
            (item) => `
              <div class="price-row">
                <span>${item.qty} x ${escapeHtml(item.name)}${item.optionsText ? `<small>${escapeHtml(item.optionsText)}</small>` : ""}</span>
                <strong>${money.format(item.unitPrice * item.qty)}</strong>
              </div>
            `,
          )
          .join("")}
        <div class="total-line"><span>Subtotal s/IVA</span><strong>${money.format(totals.netSubtotal)}</strong></div>
        <div class="total-line"><span>${escapeHtml(ivaLabel(totals.ivaRate))}</span><strong>${money.format(totals.iva)}</strong></div>
        <div class="total-line grand"><span>Total</span><strong>${money.format(totals.total)}</strong></div>
      </div>
    </section>
  `;
}

function renderCheckoutModal(order) {
  const totals = calculateTotals(order);
  const cashSession = currentCashSession();
  const paymentMethod = state.paymentMethod || "Efectivo";
  const cashDue = paymentBucket(paymentMethod) === "cash" ? totals.subtotal : 0;
  const pendingWarning = totals.pending
    ? `<div class="checkout-warning">${svg("alert")}Hay ${totals.pending} pieza${totals.pending === 1 ? "" : "s"} sin comandar.</div>`
    : "";
  const cashWarning = !cashSession
    ? `<div class="checkout-warning">${svg("alert")}Abre caja antes de cobrar efectivo o tarjeta.</div>`
    : "";
  const cancelLabel = order.type === "table" ? "Cancelar mesa" : "Cancelar orden";
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Cerrar ${escapeHtml(orderLabel(order))}</h2>
          <p class="panel-kicker">Confirma el pago antes de cerrar la mesa</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body checkout-body" data-checkout-form data-order-id="${order.id}">
        ${pendingWarning}
        ${cashWarning}
        <div class="checkout-total">
          <span>Total a cobrar</span>
          <strong data-checkout-total>${money.format(totals.total)}</strong>
          <small>Subtotal s/IVA ${money.format(totals.netSubtotal)} · ${escapeHtml(ivaLabel(totals.ivaRate))} ${money.format(totals.iva)}</small>
        </div>
        <section class="checkout-payment-box" data-checkout-payment>
          <div class="tip-box-head">
            <strong>${svg("cash")}Metodo de pago</strong>
            <span data-payment-preview>${escapeHtml(paymentMethod)}</span>
          </div>
          <div class="tip-options">
            <label><input type="radio" name="paymentMethod" value="Efectivo" ${paymentMethod === "Efectivo" ? "checked" : ""} />Efectivo</label>
            <label><input type="radio" name="paymentMethod" value="Tarjeta" ${paymentMethod === "Tarjeta" ? "checked" : ""} />Tarjeta</label>
          </div>
          <div class="cash-fields" data-cash-fields>
            <label class="field">
              <span>Efectivo recibido</span>
              <input name="cashReceived" data-cash-received type="number" min="0" step="0.01" value="${cashDue.toFixed(2)}" />
            </label>
            <div class="cash-change-box">
              <span>Total efectivo</span>
              <strong data-cash-due>${money.format(cashDue)}</strong>
              <span>Propina efectivo</span>
              <strong data-cash-tip>${money.format(0)}</strong>
              <span class="grand">Cambio a entregar</span>
              <strong data-cash-change class="grand">${money.format(0)}</strong>
            </div>
          </div>
        </section>
        <section class="tip-box" data-checkout-tip data-subtotal="${totals.subtotal}">
          <div class="tip-box-head">
            <strong>${svg("cash")}Propina</strong>
            <span data-tip-preview>${money.format(0)}</span>
          </div>
          <div class="tip-options">
            <label><input type="radio" name="tipMode" value="none" checked />Sin propina</label>
            <label><input type="radio" name="tipMode" value="fixed" />Fija</label>
            <label><input type="radio" name="tipMode" value="percent" />Porcentaje</label>
          </div>
          <label class="field tip-value-field">
            <span>Monto o porcentaje</span>
            <input name="tipValue" data-tip-value type="number" min="0" step="0.01" value="0" />
          </label>
          <div>
            <p class="mini-title">Metodo de propina</p>
            <div class="tip-options">
              <label><input type="radio" name="tipPaymentMethod" value="Efectivo" ${paymentMethod === "Efectivo" ? "checked" : ""} />Efectivo</label>
              <label><input type="radio" name="tipPaymentMethod" value="Tarjeta" ${paymentMethod === "Tarjeta" ? "checked" : ""} />Tarjeta</label>
            </div>
          </div>
        </section>
        <div class="checkout-actions">
          <button class="primary-button" type="submit" ${cashSession ? "" : "disabled"}>${svg("check")}Confirmar y cerrar</button>
          <button class="danger-button" type="button" data-open-modal="cancel-order" data-order-id="${order.id}">${svg("cancel")}${cancelLabel}</button>
        </div>
      </form>
    </section>
  `;
}

function renderAdjustTipModal(sale) {
  const tipAmount = saleTip(sale);
  const tipMethod = saleTipPaymentMethod(sale);
  const canAdjust = canAdjustSaleTip(sale);
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Propina de ${escapeHtml(sale.label || "venta")}</h2>
          <p class="panel-kicker">Ajuste posterior al cierre de la mesa</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-adjust-tip-form data-sale-id="${sale.id}">
        ${canAdjust ? "" : `<div class="checkout-warning">${svg("alert")}La caja de esta venta ya fue cortada o no esta abierta.</div>`}
        <div class="checkout-total">
          <span>Total actual</span>
          <strong>${money.format(saleTotal(sale))}</strong>
        </div>
        <label class="field">
          <span>Propina</span>
          <input name="tipAmount" type="number" min="0" step="0.01" value="${tipAmount.toFixed(2)}" ${canAdjust ? "" : "disabled"} required />
        </label>
        <div>
          <p class="mini-title">Metodo de propina</p>
          <div class="tip-options">
            <label><input type="radio" name="tipPaymentMethod" value="Efectivo" ${tipMethod === "Efectivo" ? "checked" : ""} ${canAdjust ? "" : "disabled"} />Efectivo</label>
            <label><input type="radio" name="tipPaymentMethod" value="Tarjeta" ${tipMethod === "Tarjeta" ? "checked" : ""} ${canAdjust ? "" : "disabled"} />Tarjeta</label>
          </div>
        </div>
        <button class="primary-button" type="submit" ${canAdjust ? "" : "disabled"}>${svg("check")}Guardar propina</button>
      </form>
    </section>
  `;
}

function renderSaleDetailModal(sale) {
  const subtotal = saleSubtotal(sale);
  const netSubtotal = saleNetSubtotal(sale);
  const ivaAmount = saleIvaAmount(sale);
  const ivaRate = saleIvaRate(sale);
  const tipAmount = saleTip(sale);
  const total = saleTotal(sale);
  const closedAt = saleClosedAt(sale);
  const cashDue = Number(sale.payment?.cashDue) || 0;
  const cashReceived = Number(sale.payment?.cashReceived) || 0;
  const changeGiven = Number(sale.payment?.changeGiven) || 0;
  const items = Array.isArray(sale.items) ? sale.items : [];
  const uid = paymentUidForSale(sale);
  const orderNumber = orderNumberLabel(sale);
  const waitMinutes = Number(sale.waitMinutes) || minutesBetween(sale.openedAt, closedAt);
  return `
    <section class="panel modal-panel sale-detail-modal">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Cuenta cerrada</h2>
          <p class="panel-kicker">ID ${escapeHtml(orderNumber)}${uid ? ` · UID ${escapeHtml(uid)}` : ""}</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <div class="panel-body sale-detail-body">
        <section class="sale-detail-hero">
          <div>
            <span>Total cobrado</span>
            <strong>${money.format(total)}</strong>
            <small>${escapeHtml(sale.label || sale.orderId || "Venta")}</small>
          </div>
          <div>
            <span>Hora de pago</span>
            <strong>${escapeHtml(formatSalePaymentTime(closedAt))}</strong>
            <small>Cierre registrado en caja</small>
          </div>
        </section>
        <section class="sale-detail-meta">
          <div><span>Metodo</span><strong>${escapeHtml(sale.paymentMethod || "Efectivo")}</strong></div>
          <div><span>Mesero</span><strong>${escapeHtml(waiterName(sale.waiterId))}</strong></div>
          <div><span>Cajero</span><strong>${escapeHtml(waiterName(sale.cashierId))}</strong></div>
          <div><span>Tiempo mesa</span><strong>${formatDuration(waitMinutes)}</strong></div>
        </section>
        <section class="sale-detail-lines">
          <div class="sale-detail-section-head">
            <h3>Resumen de cuenta</h3>
            <span>${items.length} articulo${items.length === 1 ? "" : "s"}</span>
          </div>
          ${
            items.length
              ? items
                  .map((item) => {
                    const product = getProduct(item.productId);
                    const isMixto = Boolean(lineParts(item));
                    return `
                      <div class="sale-detail-line${isMixto ? " is-mixto" : ""}">
                        <div>
                          <strong>${Number(item.qty) || 0} x ${escapeHtml(item.name || "Producto")}${isMixto ? ` <span class="mixto-badge">Mixto ×${lineParts(item).length}</span>` : ""}</strong>
                          ${isMixto && product ? renderMixtoBreakdown(product, item) : (item.optionsText ? `<small>${escapeHtml(item.optionsText)}</small>` : "")}
                          ${item.note ? `<small>Nota: ${escapeHtml(item.note)}</small>` : ""}
                        </div>
                        <span>${money.format(Number(item.unitPrice) || 0)} c/u</span>
                        <strong>${money.format(saleLineTotal(item))}</strong>
                      </div>
                    `;
                  })
                  .join("")
              : `<div class="empty-state compact">Esta venta no tiene articulos registrados.</div>`
          }
        </section>
        <section class="sale-detail-totals">
          <div><span>Subtotal s/IVA</span><strong>${money.format(netSubtotal)}</strong></div>
          <div><span>${escapeHtml(ivaLabel(ivaRate))}</span><strong>${money.format(ivaAmount)}</strong></div>
          <div><span>Consumo</span><strong>${money.format(subtotal)}</strong></div>
          <div><span>Propina</span><strong>${money.format(tipAmount)}</strong><small>${escapeHtml(saleTipPaymentMethod(sale))}</small></div>
          <div class="grand"><span>Total</span><strong>${money.format(total)}</strong></div>
        </section>
        ${
          cashDue > 0
            ? `
              <section class="sale-detail-cash">
                <div><span>Efectivo recibido</span><strong>${money.format(cashReceived)}</strong></div>
                <div><span>Cambio entregado</span><strong>${money.format(changeGiven)}</strong></div>
              </section>
            `
            : ""
        }
        ${sale.comments ? `<div class="sale-detail-note"><strong>Nota</strong><p>${escapeHtml(sale.comments)}</p></div>` : ""}
        ${
          isAdminUser() || sale.cashierId === currentUser()?.id || sale.waiterId === currentUser()?.id
            ? `
              <section class="sale-detail-actions">
                <button class="secondary-button" data-open-modal="adjust-tip" data-sale-id="${escapeAttr(sale.id || sale.orderId || "")}">${svg("cash")}Ajustar propina</button>
              </section>
            `
            : ""
        }
      </div>
    </section>
  `;
}

function renderCancelOrderModal(order) {
  const totals = calculateTotals(order);
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Cancelar ${escapeHtml(orderLabel(order))}</h2>
          <p class="panel-kicker">Incidencia sin cobro · ${money.format(totals.total)}</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid cancel-form" data-cancel-order-form data-order-id="${order.id}">
        <div class="incident-copy">
          ${svg("alert")}
          <p>La orden se cerrara como cancelada y quedara registrada en Datos.</p>
        </div>
        <label class="field">
          <span>Nota obligatoria</span>
          <textarea name="note" rows="4" required placeholder="Motivo de la cancelacion o incidencia"></textarea>
        </label>
        <button class="danger-button" type="submit">${svg("cancel")}Confirmar cancelacion</button>
      </form>
    </section>
  `;
}

function renderCancelLineModal(order, line, modal = {}) {
  const source = modal.cancelSource || "venta";
  const batch = findBatchForLine(order, line.id, modal.commandId, source === "venta" ? ["new"] : ["new", "preparing", "ready"]);
  const batchLine = batch?.lines?.find((item) => item.lineId === line.id);
  const stage = batch?.status || lineServiceStatus(line, order);
  const allowed =
    source === "venta"
      ? stage === "new" || lineServiceStatus(line, order) === "waiting"
      : ["new", "preparing", "ready"].includes(stage);
  const maxQty = Math.max(0, Math.min(line.qty, batchLine?.qty ?? line.qty));
  if (!allowed || maxQty <= 0) {
    return `
      <section class="panel modal-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">No se puede cancelar</h2>
            <p class="panel-kicker">${escapeHtml(line.name)}</p>
          </div>
          <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
        </div>
        <div class="panel-body">
          <div class="empty-state compact">Esta linea ya no esta en una etapa cancelable desde esta ventana.</div>
        </div>
      </section>
    `;
  }
  const stageLabel = cancellationStageLabel(stage);
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Cancelar producto</h2>
          <p class="panel-kicker">${escapeHtml(orderLabel(order))} · ${stageLabel}</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form
        class="panel-body field-grid cancel-form"
        data-cancel-line-form
        data-order-id="${order.id}"
        data-line-id="${line.id}"
        data-command-id="${batch?.id || ""}"
        data-cancel-source="${escapeAttr(source)}"
      >
        <div class="cancel-line-summary">
          <span>${svg("cancel")}</span>
          <p><strong>${escapeHtml(line.name)}</strong>${line.optionsText ? `<small>${escapeHtml(line.optionsText)}</small>` : ""}</p>
        </div>
        <div class="field-row">
          <label class="field">
            <span>Cantidad a cancelar</span>
            <input name="qty" type="number" min="1" max="${maxQty}" value="1" required />
          </label>
          <label class="field">
            <span>Disponible en esta comanda</span>
            <input value="${maxQty}" disabled />
          </label>
        </div>
        <label class="field">
          <span>Nota opcional</span>
          <textarea name="note" rows="3" placeholder="Motivo o detalle para la incidencia"></textarea>
        </label>
        <button class="danger-button" type="submit">${svg("cancel")}Cancelar producto</button>
      </form>
    </section>
  `;
}

function renderKitchen() {
  const commands = kitchenCommands();
  return `
    <section class="kitchen-board">
      <div class="board-header">
        <div>
          <h2>Cocina</h2>
          <p>${commands.length} comandas activas</p>
        </div>
        <span class="stat-pill">${commands.filter((item) => item.status === "new").length} nuevas</span>
      </div>
      <div class="kitchen-columns">
        ${["new", "preparing", "ready"].map((status) => renderKitchenColumn(status, commands)).join("")}
      </div>
    </section>
  `;
}

function renderKitchenColumn(status, commands) {
  const labels = {
    new: "Nuevas",
    preparing: "En preparacion",
    ready: "Listas para entregar",
  };
  const items = commands.filter((item) => item.status === status);
  return `
    <section class="kitchen-column">
      <h3><span>${labels[status]}</span><b>${items.length}</b></h3>
      <div class="kitchen-stack">
        ${
          items.length
            ? items.map(renderKitchenCard).join("")
            : `<div class="empty-state compact-empty">Sin comandas.</div>`
        }
      </div>
    </section>
  `;
}

function renderKitchenCard(command) {
  const reference =
    command.status === "preparing"
      ? command.startedAt || command.updatedAt || command.createdAt
      : command.status === "ready"
        ? command.readyAt || command.updatedAt || command.createdAt
        : command.createdAt;
  const minutes = minutesSince(reference);
  const timeLabel =
    command.status === "preparing"
      ? `Prep. ${elapsed(reference)}`
      : command.status === "ready"
        ? `Lista hace ${elapsed(reference)}`
        : `Espera ${elapsed(reference)}`;
  // Alerta visual cuando una comanda lleva demasiado tiempo en su estado actual.
  // new/preparing >= 10m: warn; >= 15m: late
  let urgency = "";
  if (command.status !== "ready") {
    if (minutes >= 15) urgency = "is-late";
    else if (minutes >= 10) urgency = "is-warn";
  }
  const wasEdited = Boolean(command.hasEdits || command.editedAt);
  return `
    <article class="kitchen-card status-${command.status} ${urgency}${wasEdited ? " is-edited" : ""}">
      <div class="kitchen-card-head">
        <div>
          <h4>${escapeHtml(command.label)}${wasEdited ? ` <span class="kitchen-edit-badge">${svg("note")}Editada</span>` : ""}</h4>
          <p>${formatTime(command.createdAt)} · ${escapeHtml(waiterName(command.createdBy))}${wasEdited && command.editedAt ? ` · editado ${elapsed(command.editedAt)} atras` : ""}</p>
          <span class="kitchen-card-timer">${svg("clock")}${timeLabel}</span>
        </div>
        <strong>${command.lines.reduce((sum, line) => sum + line.qty, 0)} pzas</strong>
      </div>
      <div class="kitchen-lines">
        ${command.lines
          .map(
            (line) => {
              const product = getProduct(line.productId);
              const isMixto = Boolean(lineParts(line));
              return `
              <div class="kitchen-line-row${isMixto ? " is-mixto" : ""}">
                <div class="kitchen-line-copy">
                  <strong>${line.qty} x ${escapeHtml(line.name)}${isMixto ? ` <span class="mixto-badge">Mixto ×${lineParts(line).length}</span>` : ""}</strong>
                  ${isMixto && product ? renderMixtoBreakdown(product, line) : (line.optionsText ? `<span>${escapeHtml(line.optionsText)}</span>` : "")}
                  ${line.note ? `<em>${svg("note")}${escapeHtml(line.note)}</em>` : ""}
                </div>
                <button
                  class="icon-button line-cancel-button"
                  data-open-modal="cancel-line"
                  data-order-id="${command.orderId}"
                  data-command-id="${command.id}"
                  data-line-id="${line.lineId}"
                  data-cancel-source="cocina"
                  title="Cancelar producto"
                >${svg("cancel")}</button>
              </div>
            `;
            },
          )
          .join("")}
      </div>
      <div class="kitchen-actions">
        ${command.status === "new" ? `<button class="secondary-button" data-command-status="${command.orderId}:${command.id}:preparing">${svg("clock")}Preparar</button>` : ""}
        ${command.status === "preparing" ? `<button class="primary-button" data-command-status="${command.orderId}:${command.id}:ready">${svg("check")}Lista</button>` : ""}
      </div>
    </article>
  `;
}

function renderInventory() {
  const inventory = currentInventory();
  const total = inventory.reduce((sum, item) => sum + item.totalCost, 0);
  const categories = [...new Set(inventory.map((item) => item.category))];
  const lowStockCount = inventory.filter((item) => Number(item.qty) <= 1).length;
  const lowStockTone = lowStockCount === 0 ? "ok" : lowStockCount <= 5 ? "warn" : "danger";
  const estimatedCount = inventory.filter(inventoryItemHasEstimatedExtraUsage).length;
  return `
    <div class="inventory-layout">
      <section class="summary-grid">
        ${renderSummaryCard("Valor inventario", money.format(total))}
        ${renderSummaryCard("Categorias", String(categories.length))}
        ${renderSummaryCard("Insumos", String(inventory.length))}
        ${renderSummaryCard("Bajo stock", String(lowStockCount), lowStockTone)}
        ${renderSummaryCard("Extras estimados", String(estimatedCount), estimatedCount ? "warn" : "ok")}
      </section>
      <section class="inventory-controls">
        <section class="panel panel-body field-grid admin-tools">
          <h2 class="panel-title">Catalogo de insumos</h2>
          <p class="muted-text">Las altas y cambios de costo se hacen en Catalogo. Esta pantalla controla existencias y movimientos.</p>
          <button class="secondary-button" data-nav="recipes">${svg("note")}Abrir Catalogo</button>
        </section>
        ${renderInventoryPurchaseForm(inventory)}
        ${renderInventoryWasteForm(inventory)}
        ${
          isAdminUser()
            ? `
              <section class="panel panel-body field-grid admin-tools">
                <h2 class="panel-title">Reinicio de inventario</h2>
                <p class="muted-text">Deja todas las cantidades en cero sin borrar los insumos ni sus costos unitarios.</p>
                <button class="danger-button" data-reset-action="inventory-zero">${svg("trash")}Inventario a cero</button>
              </section>
            `
            : ""
        }
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Inventario</h2>
            <p class="panel-kicker">Base inicial desde COSTOS INSUMOS Y PAN.xlsx</p>
          </div>
        </div>
        <div class="panel-body table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Insumo</th>
                <th>Proveedor</th>
                <th>Unidad</th>
                <th>Cantidad</th>
                <th>Costo unit.</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${inventory
                .map(
                  (item) => `
                    <tr>
                      <td>${escapeHtml(item.category)}</td>
                      <td><strong>${escapeHtml(item.name)}</strong></td>
                      <td>${escapeHtml(item.supplier)}</td>
                      <td>${escapeHtml(item.unit)}</td>
                      <td>${formatNumber(item.qty)}</td>
                      <td>${money.format(item.unitCost)}</td>
                      <td><strong>${money.format(item.totalCost)}</strong></td>
                      <td class="row-actions">
                        <button class="icon-button" data-inventory-quick="${item.id}:in" title="Entrada +1">${svg("plus")}</button>
                        <button class="icon-button" data-inventory-quick="${item.id}:out" title="Salida -1">${svg("minus")}</button>
                      </td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
      ${renderFullInventoryAudit(inventory)}
    </div>
  `;
}

function inventorySelectOptions(inventory) {
  return inventory
    .map((item) => `<option value="${item.id}">${escapeHtml(item.name)} · ${formatNumber(item.qty)} ${escapeHtml(item.unit)}</option>`)
    .join("");
}

function renderInventoryPurchaseForm(inventory) {
  return `
    <form class="panel panel-body field-grid" data-inventory-purchase-form>
      <h2 class="panel-title">Movimiento de inventario</h2>
      <p class="muted-text">Subir ticket suma inventario, actualiza costo y descuenta el importe de caja si hay caja abierta.</p>
      <label class="field">
        <span>Insumo</span>
        <select name="itemId">${inventorySelectOptions(inventory)}</select>
      </label>
      <div class="field-row">
        <label class="field"><span>Cantidad comprada</span><input name="qty" type="number" min="0.001" step="0.001" required /></label>
        <label class="field"><span>Coste del ticket</span><input name="amount" type="number" min="0.01" step="0.01" required /></label>
      </div>
      <div class="field-row">
        <label class="field"><span>Proveedor</span><input name="supplier" placeholder="MERCADO" /></label>
        <label class="field"><span>Ticket / nota</span><input name="ticket" placeholder="Folio, factura o detalle" /></label>
      </div>
      <button class="primary-button" type="submit">${svg("plus")}Subir ticket</button>
    </form>
  `;
}

function renderInventoryWasteForm(inventory) {
  return `
    <form class="panel panel-body field-grid" data-inventory-waste-form>
      <h2 class="panel-title">Merma</h2>
      <p class="muted-text">Registra perdida fisica de insumos sin afectar caja.</p>
      <label class="field">
        <span>Insumo</span>
        <select name="itemId">${inventorySelectOptions(inventory)}</select>
      </label>
      <div class="field-row">
        <label class="field"><span>Cantidad</span><input name="qty" type="number" min="0.001" step="0.001" required /></label>
        <label class="field"><span>Motivo</span><input name="reason" required placeholder="Caducidad, rotura, preparacion fallida" /></label>
      </div>
      <button class="danger-button" type="submit">${svg("minus")}Registrar merma</button>
    </form>
  `;
}

function renderFullInventoryAudit(inventory) {
  const rows = [...inventory].sort((a, b) => a.category.localeCompare(b.category, "es") || a.name.localeCompare(b.name, "es"));
  return `
    <section class="panel data-grid-wide full-inventory-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Inventario completo</h2>
          <p class="panel-kicker">Compara lo que debe haber contra el conteo fisico y calcula perdida o ganancia.</p>
        </div>
        <strong class="inventory-audit-total" data-inventory-count-total>${money.format(0)}</strong>
      </div>
      <form class="panel-body" data-full-inventory-form>
        <div class="table-wrap">
          <table class="data-table inventory-count-table">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Debe haber</th>
                <th>Conteo fisico</th>
                <th>Diferencia</th>
                <th>Valor</th>
                <th>Aviso</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map((item) => {
                  const estimated = inventoryItemHasEstimatedExtraUsage(item);
                  return `
                    <tr data-inventory-count-row data-item-id="${item.id}" data-expected="${Number(item.qty) || 0}" data-unit-cost="${Number(item.unitCost) || 0}">
                      <td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.unit)}</small></td>
                      <td>${formatNumber(item.qty)} ${escapeHtml(item.unit)}</td>
                      <td><input class="table-input" name="count:${item.id}" type="number" min="0" step="0.001" placeholder="Sin contar" /></td>
                      <td data-count-diff>-</td>
                      <td data-count-value>-</td>
                      <td>${estimated ? `<span class="extra-warning is-warning">Uso por extra estimado</span>` : `<span class="extra-warning">Exacto segun recetas</span>`}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="inventory-audit-actions">
          <p class="muted-text">Solo se ajustan las filas donde captures conteo fisico.</p>
          <button class="secondary-button" type="submit">${svg("check")}Aplicar conteo completo</button>
        </div>
      </form>
    </section>
  `;
}

function recipeForProduct(product) {
  return configuredRecipeForProduct(product, defaultSelectionsFor(product));
}

function recipeCostForItems(recipe = []) {
  const inventory = currentInventory();
  return roundCurrency(
    normalizeRecipe(recipe).reduce((sum, item) => {
      const inventoryItem = inventory.find((entry) => normalize(entry.name) === normalize(item.name));
      return sum + (Number(inventoryItem?.unitCost) || 0) * (Number(item.qty) || 0);
    }, 0),
  );
}

function financialMetrics(price, cost) {
  const salePrice = Math.max(0, Number(price) || 0);
  const netSalePrice = taxBreakdownForGross(salePrice).netSubtotal;
  const itemCost = Math.max(0, Number(cost) || 0);
  const profit = roundCurrency(netSalePrice - itemCost);
  const margin = netSalePrice ? (profit / netSalePrice) * 100 : 0;
  return {
    price: roundCurrency(salePrice),
    netPrice: netSalePrice,
    iva: roundCurrency(salePrice - netSalePrice),
    cost: roundCurrency(itemCost),
    profit,
    margin,
  };
}

function averageFinancialMetrics(entries) {
  const source = entries.filter(Boolean);
  if (!source.length) return financialMetrics(0, 0);
  const totals = source.reduce(
    (sum, item) => ({
      price: sum.price + item.price,
      netPrice: sum.netPrice + (Number(item.netPrice) || 0),
      iva: sum.iva + (Number(item.iva) || 0),
      cost: sum.cost + item.cost,
      profit: sum.profit + item.profit,
      margin: sum.margin + item.margin,
    }),
    { price: 0, netPrice: 0, iva: 0, cost: 0, profit: 0, margin: 0 },
  );
  return {
    price: roundCurrency(totals.price / source.length),
    netPrice: roundCurrency(totals.netPrice / source.length),
    iva: roundCurrency(totals.iva / source.length),
    cost: roundCurrency(totals.cost / source.length),
    profit: roundCurrency(totals.profit / source.length),
    margin: totals.margin / source.length,
    sampleCount: source.length,
  };
}

function variantFinancialMetrics(product, option, choiceIndex, recipeOverride = null) {
  const selections = defaultSelectionsFor(product);
  selections[option.id] = choiceIndex;
  const price = configuredUnitPrice(product, selections);
  const recipe = recipeOverride || recipeForOptionChoice(product, option, choiceIndex);
  return financialMetrics(price, recipeCostForItems(recipe));
}

function productVariantFinancialEntries(product) {
  const variants = normalizeVariantRecipes(product.variantRecipes);
  return variantOptionsForProduct(product).flatMap((option) =>
    option.choices.map((choice, index) => {
      const existing = variants.find(
        (variant) => variant.optionId === option.id && normalize(variant.choiceLabel) === normalize(choice.label),
      );
      const recipe = existing?.recipe?.length ? existing.recipe : recipeForOptionChoice(product, option, index);
      return {
        optionId: option.id,
        choiceLabel: choice.label,
        active: choice.active !== false,
        ...variantFinancialMetrics(product, option, index, recipe),
      };
    }),
  );
}

function productFinancialMetrics(product) {
  const variants = productVariantFinancialEntries(product);
  const activeVariants = variants.filter((variant) => variant.active !== false);
  const source = activeVariants.length ? activeVariants : variants;
  if (source.length) {
    return {
      ...averageFinancialMetrics(source),
      averaged: source.length > 1,
      variantCount: source.length,
    };
  }
  return {
    ...financialMetrics(Number(product.price) || 0, productRecipeCost(product)),
    averaged: false,
    variantCount: 0,
    sampleCount: 1,
  };
}

function renderRecipes() {
  if (!isAdminUser()) return "";
  const products = menuProducts({ includeInactive: true });
  const inventory = currentInventory();
  const extras = extraCatalog({ includeInactive: true });
  const categories = [...new Set(products.map((product) => product.section))];
  const customCount = products.filter((product) => product.custom).length;
  const editedCount = products.filter((product) => product.edited && !product.custom).length;
  const mode = ["products", "ingredients", "extras"].includes(state.recipesMode) ? state.recipesMode : "products";
  const newModal = mode === "ingredients" ? "new-ingredient" : mode === "extras" ? "new-extra" : "new-product";
  const newLabel = mode === "ingredients" ? "Nuevo insumo" : mode === "extras" ? "Nuevo extra" : "Nuevo platillo";
  return `
    <div class="recipes-layout">
      <section class="board-header">
        <div>
          <h2>Catalogo</h2>
          <p>Catalogo de articulos, extras, recetas y costos de insumos</p>
        </div>
        <div class="header-actions">
          <button class="secondary-button ${mode === "products" ? "is-active" : ""}" data-recipes-mode="products">${svg("sale")}Articulos</button>
          <button class="secondary-button ${mode === "ingredients" ? "is-active" : ""}" data-recipes-mode="ingredients">${svg("inventory")}Insumos</button>
          <button class="secondary-button ${mode === "extras" ? "is-active" : ""}" data-recipes-mode="extras">${svg("plus")}Extras</button>
          <button class="primary-button" data-open-modal="${newModal}">${svg("plus")}${newLabel}</button>
        </div>
      </section>
      <section class="summary-grid">
        ${renderSummaryCard("Articulos", String(products.length))}
        ${renderSummaryCard("En menu", String(products.filter((product) => product.active !== false).length))}
        ${renderSummaryCard("Insumos", String(inventory.length))}
        ${renderSummaryCard("Extras", String(extras.filter((extra) => extra.active !== false).length))}
      </section>
      ${mode === "ingredients" ? renderIngredientsCatalog(inventory) : mode === "extras" ? renderExtrasCatalog(extras) : renderRecipeProductCatalog(products, categories)}
    </div>
  `;
}

function renderRecipeProductCatalog(products, categories) {
  const sectionList = categories.length ? categories : ["Menu"];
  if (!sectionList.includes(state.recipesSection)) state.recipesSection = sectionList[0];
  const subsections = ["Todos", ...new Set(products.filter((product) => product.section === state.recipesSection).map((product) => product.subsection))];
  if (!subsections.includes(state.recipesSubsection)) state.recipesSubsection = "Todos";
  const query = normalize(state.recipesSearch);
  const filtered = products.filter((product) => {
    const inSection = product.section === state.recipesSection;
    const inSubsection = state.recipesSubsection === "Todos" || product.subsection === state.recipesSubsection;
    const text = normalize(`${product.name} ${product.description} ${product.section} ${product.subsection}`);
    return inSection && inSubsection && text.includes(query);
  });
  return `
    <section class="panel recipe-catalog-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Articulos en venta</h2>
          <p class="panel-kicker">Navegacion por categorias igual que Venta</p>
        </div>
        <div class="search-wrap compact-search">
          ${svg("search")}
          <input class="search-input" data-recipes-search value="${escapeAttr(state.recipesSearch)}" placeholder="Buscar articulo" />
        </div>
      </div>
      <div class="panel-body">
        <div class="section-tabs">
          ${sectionList
            .map(
              (section) => `
                <button class="section-tab ${state.recipesSection === section ? "is-active" : ""}" data-recipes-section="${escapeAttr(section)}">
                  ${escapeHtml(section)}
                  <small>${products.filter((item) => item.section === section).length}</small>
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="chip-row">
          ${subsections
            .map(
              (subsection) => `
                <button class="chip ${state.recipesSubsection === subsection ? "is-active" : ""}" data-recipes-subsection="${escapeAttr(subsection)}">
                  ${escapeHtml(subsection)}
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="menu-grid recipe-product-grid">
          ${filtered.length ? filtered.map(renderRecipeProductCard).join("") : `<div class="empty-state">No hay articulos en esta combinacion.</div>`}
        </div>
      </div>
    </section>
  `;
}

function renderRecipeProductCard(product) {
  const recipe = recipeForProduct(product);
  const metrics = productFinancialMetrics(product);
  const sourceLabel = product.custom ? "Nuevo" : product.edited ? "Editado" : "Base";
  const variantCount = productVariantFinancialEntries(product).length;
  const averageLabel = metrics.averaged ? " prom." : "";
  return `
    <article class="menu-item recipe-product-card ${product.active === false ? "is-cancelled" : ""}">
      <span class="menu-item-top">
        <span class="menu-icon">${svg(product.icon)}</span>
        <span class="price-with-tax"><strong>${money.format(product.price)}</strong><small>IVA ${money.format(taxBreakdownForGross(product.price).iva)}</small></span>
      </span>
      <span>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
      </span>
      <span class="recipe-card-metrics">
        <span>${escapeHtml(product.subsection)}</span>
        <span>${recipe.length} insumo${recipe.length === 1 ? "" : "s"}</span>
        <span>${variantCount} variante${variantCount === 1 ? "" : "s"}</span>
      </span>
      <span class="recipe-card-cost">
        <span>Costo${averageLabel} ${money.format(metrics.cost)}</span>
        <span>Ganancia${averageLabel} ${money.format(metrics.profit)}</span>
        <strong>Margen${averageLabel} ${formatNumber(metrics.margin)}%</strong>
      </span>
      <span class="recipe-card-actions">
        <small>${sourceLabel} · ${product.active === false ? "Oculto" : "Activo"}</small>
        <label class="check-toggle compact">
          <input type="checkbox" data-menu-product-active="${product.id}" ${product.active === false ? "" : "checked"} />
          <span>Disponible</span>
        </label>
        <button class="secondary-button compact" data-open-modal="edit-product" data-product-id="${product.id}">${svg("note")}Editar</button>
      </span>
    </article>
  `;
}

function renderIngredientsCatalog(inventory) {
  const categoryRecords = ingredientCategoryRecords();
  const allCategories = ["Todos", ...categoryRecords.map((item) => item.name)];
  if (!allCategories.includes(state.ingredientsCategory)) state.ingredientsCategory = "Todos";
  const categoryQuery = normalize(state.ingredientsCategorySearch);
  let categories = allCategories.filter((category) => category === "Todos" || !categoryQuery || normalize(category).includes(categoryQuery));
  if (!categories.includes(state.ingredientsCategory)) categories = [state.ingredientsCategory, ...categories];
  const categoryOptions = categoryRecords.map((item) => item.name);
  const selectedCategoryIsNonRecipe = state.ingredientsCategory !== "Todos" && !categoryRecipeEligible(state.ingredientsCategory);
  const selectedCategoryCount =
    state.ingredientsCategory === "Todos" ? inventory.length : inventory.filter((item) => item.category === state.ingredientsCategory).length;
  const query = normalize(state.ingredientsSearch);
  const filtered = inventory
    .filter((item) => state.ingredientsCategory === "Todos" || item.category === state.ingredientsCategory)
    .filter((item) => normalize(`${item.name} ${item.category} ${item.supplier} ${item.unit}`).includes(query))
    .sort((a, b) => a.category.localeCompare(b.category, "es") || a.name.localeCompare(b.name, "es"));
  return `
    <section class="panel data-grid-wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Catalogo de insumos</h2>
          <p class="panel-kicker">Edita categoria directo en la tabla. Escribir una categoria nueva la crea.</p>
        </div>
        <div class="ingredient-catalog-actions">
          <div class="search-wrap compact-search">
            ${svg("search")}
            <input class="search-input" data-ingredients-search value="${escapeAttr(state.ingredientsSearch)}" placeholder="Buscar insumo" />
          </div>
          <button class="primary-button compact" data-open-modal="new-ingredient" ${state.ingredientsCategory !== "Todos" ? `data-ingredient-category="${escapeAttr(state.ingredientsCategory)}"` : ""}>
            ${svg("plus")}${state.ingredientsCategory === "Todos" ? "Nuevo insumo" : "Nuevo en categoria"}
          </button>
          <button class="secondary-button compact" data-open-modal="new-ingredient-category">${svg("plus")}Nueva categoria</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="ingredient-category-status ${selectedCategoryIsNonRecipe ? "is-non-recipe" : ""}">
          <div>
            <span>Categoria activa</span>
            <strong>${escapeHtml(state.ingredientsCategory)}</strong>
          </div>
          <small>${selectedCategoryIsNonRecipe ? "No-comida / no-receta" : "Disponible para recetas"} · ${selectedCategoryCount} insumo${selectedCategoryCount === 1 ? "" : "s"}</small>
        </div>
        <div class="ingredient-category-tools">
          <div class="search-wrap compact-search">
            ${svg("search")}
            <input class="search-input" data-ingredient-category-search value="${escapeAttr(state.ingredientsCategorySearch)}" placeholder="Buscar categoria" />
          </div>
        </div>
        <div class="ingredient-category-nav">
          <button class="nav-scroll-button" type="button" data-ingredients-category-step="-1" title="Categorias anteriores">${svg("chevronLeft")}</button>
          <div class="ingredient-category-scroll" data-ingredients-category-scroll>
            <div class="chip-row ingredient-category-row">
              ${categories
                .map(
                  (category) => {
                    const isNonRecipeCategory = category !== "Todos" && !categoryRecipeEligible(category);
                    return `
                    <button class="chip ${state.ingredientsCategory === category ? "is-active" : ""} ${isNonRecipeCategory ? "is-non-recipe" : ""}" data-ingredients-category="${escapeAttr(category)}">
                      ${escapeHtml(category)}
                    </button>
                  `;
                  },
                )
                .join("")}
            </div>
          </div>
          <button class="nav-scroll-button" type="button" data-ingredients-category-step="1" title="Mas categorias">${svg("chevronRight")}</button>
        </div>
        <datalist id="ingredient-catalog-category-options">
          ${categoryOptions.map((category) => `<option value="${escapeAttr(category)}"></option>`).join("")}
        </datalist>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Insumo</th>
                <th>Proveedor</th>
                <th>Unidad</th>
                <th>Costo vigente</th>
                <th>Uso</th>
                <th>Historial</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length ? filtered.map(renderIngredientCatalogRow).join("") : `<tr><td colspan="8">No hay insumos con esos filtros.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderIngredientCatalogRow(item) {
  const recipeEligible = isRecipeIngredient(item);
  return `
    <tr class="${recipeEligible ? "" : "non-recipe-row"}">
      <td>
        <input class="table-input" data-ingredient-category-field="${item.id}" list="ingredient-catalog-category-options" value="${escapeAttr(item.category)}" title="Cambiar categoria" />
      </td>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${escapeHtml(item.supplier)}</td>
      <td>${escapeHtml(item.unit)}</td>
      <td><strong>${money.format(item.unitCost)}</strong></td>
      <td>
        <label class="check-toggle compact ingredient-recipe-toggle">
          <input type="checkbox" data-ingredient-recipe-toggle="${item.id}" ${recipeEligible ? "checked" : ""} ${isDefaultNonRecipeCategory(item.category) ? "disabled" : ""} />
          <span>${recipeEligible ? "Receta" : "No-receta"}</span>
        </label>
      </td>
      <td>${normalizeCostHistory(item.costHistory).length} cambio${normalizeCostHistory(item.costHistory).length === 1 ? "" : "s"}</td>
      <td class="row-actions">
        <button class="secondary-button compact" data-open-modal="edit-ingredient" data-ingredient-id="${item.id}">${svg("note")}Editar</button>
      </td>
    </tr>
  `;
}

function renderExtrasCatalog(extras) {
  const query = normalize(state.extrasSearch);
  const filtered = extras
    .filter((extra) => normalize(`${extra.name} ${extra.inventoryItemName}`).includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  return `
    <section class="panel data-grid-wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Catalogo de extras</h2>
          <p class="panel-kicker">Precio de venta y gramaje/cantidad que descuenta del inventario.</p>
        </div>
        <div class="ingredient-catalog-actions">
          <div class="search-wrap compact-search">
            ${svg("search")}
            <input class="search-input" data-extras-search value="${escapeAttr(state.extrasSearch)}" placeholder="Buscar extra" />
          </div>
          <button class="primary-button compact" data-open-modal="new-extra">${svg("plus")}Nuevo extra</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Extra</th>
                <th>Precio</th>
                <th>Descuento inventario</th>
                <th>Aviso</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length ? filtered.map(renderExtraCatalogRow).join("") : `<tr><td colspan="6">No hay extras definidos.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderExtraCatalogRow(extra) {
  const item = extraInventoryItem(extra);
  const warning = !item
    ? "Insumo no encontrado"
    : Number(item.qty) <= 0
      ? "Inventario en cero"
      : `Descuenta ${formatNumber(extra.qty)} ${item.unit}`;
  const warningClass = !item || Number(item.qty) <= 0 ? "is-warning" : "";
  return `
    <tr class="${extra.active === false ? "is-cancelled" : ""}">
      <td><strong>${escapeHtml(extra.name)}</strong></td>
      <td><strong>${money.format(extra.price)}</strong></td>
      <td>
        <strong>${escapeHtml(item?.name || extra.inventoryItemName || "Sin insumo")}</strong>
        <small>${formatNumber(extra.qty)} ${escapeHtml(item?.unit || extra.unit)}</small>
      </td>
      <td><span class="extra-warning ${warningClass}">${escapeHtml(warning)}</span></td>
      <td>
        <label class="check-toggle compact">
          <input type="checkbox" data-extra-active="${extra.id}" ${extra.active === false ? "" : "checked"} />
          <span>${extra.active === false ? "Oculto" : "Activo"}</span>
        </label>
      </td>
      <td class="row-actions">
        <button class="secondary-button compact" data-open-modal="edit-extra" data-extra-id="${extra.id}">${svg("note")}Editar</button>
      </td>
    </tr>
  `;
}

function recipeInventoryOption(item, selectedId) {
  return `<option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item.name)} · ${money.format(item.unitCost)}/${escapeHtml(item.unit)}</option>`;
}

function renderRecipeRows(product = null, recipeOverride = null) {
  return renderRecipeRowsFromRecipe(recipeOverride || recipeForProduct(product || { options: [], recipe: [] }), {
    itemAttr: "data-recipe-item",
    qtyAttr: "data-recipe-qty",
  });
}

function renderRecipeRowsFromRecipe(recipeSource = [], { itemAttr = "data-recipe-item", qtyAttr = "data-recipe-qty", minRows = 6 } = {}) {
  const inventory = [...recipeInventoryItems()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const recipe = normalizeRecipe(recipeSource);
  const rows = Array.from({ length: Math.max(minRows, recipe.length || 0) }, (_, index) => recipe[index] || null);
  return rows
    .map((row, index) => {
      const selectedId = row?.itemId || inventory.find((item) => normalize(item.name) === normalize(row?.name))?.id || "";
      return `
        <div class="recipe-row">
          <label class="field">
            <span>Insumo ${index + 1}</span>
            <select ${itemAttr} ${inventory.length ? "" : "disabled"}>
              <option value="">Sin insumo</option>
              ${inventory.map((item) => recipeInventoryOption(item, selectedId)).join("")}
            </select>
          </label>
          <label class="field">
            <span>Cantidad</span>
            <input ${qtyAttr} type="number" min="0" step="0.001" value="${row ? formatPlainNumber(row.qty) : ""}" placeholder="0" />
          </label>
        </div>
      `;
    })
    .join("");
}

function variantOptionsForProduct(product) {
  return (product?.options || []).filter((option) => option.type === "single" && Array.isArray(option.choices));
}

function primaryVariantOptionForProduct(product) {
  const options = variantOptionsForProduct(product);
  if (!options.length) {
    return {
      id: "variante",
      label: "Variante",
      type: "single",
      required: true,
      choices: [],
    };
  }
  return [...options].sort((left, right) => variantOptionPriority(left) - variantOptionPriority(right))[0];
}

function recipeForOptionChoice(product, option, choiceIndex) {
  const selections = defaultSelectionsFor(product);
  selections[option.id] = choiceIndex;
  return configuredRecipeForProduct({ ...product, variantRecipes: [] }, selections);
}

function variantSummaryText({ active = true, recipeCount = 0, margin = 0 } = {}) {
  return `Margen ${formatNumber(margin)}% · ${active ? "Activa" : "Inactiva"} · ${recipeCount} insumo${recipeCount === 1 ? "" : "s"}`;
}

function renderVariantRecipeEditor(product) {
  const variantOptions = variantOptionsForProduct(product);
  const primaryOption = primaryVariantOptionForProduct(product);
  const variants = normalizeVariantRecipes(product.variantRecipes);
  return `
    <section class="recipe-editor variant-recipe-editor">
      <div class="recipe-editor-head">
        <strong>${svg("plus")}Variantes de receta</strong>
        <span>Se usan al vender cada variante</span>
      </div>
      <div class="variant-add-box" data-primary-variant-option-id="${escapeAttr(primaryOption.id)}" data-primary-variant-option-label="${escapeAttr(primaryOption.label)}">
        <div class="field-row">
          <label class="field">
            <span>Nueva variante</span>
            <input name="newVariantLabel" placeholder="Ej. Carne, Queso, Especial" />
          </label>
          <button class="secondary-button" type="button" data-add-variant-choice>${svg("plus")}Anadir variante</button>
        </div>
      </div>
      <div class="variant-list" data-variant-list>
      ${variantOptions
        .map((option) =>
          option.choices
            .map((choice, index) => {
              const existing = variants.find(
                (variant) => variant.optionId === option.id && normalize(variant.choiceLabel) === normalize(choice.label),
              );
              const recipe = existing?.recipe?.length ? existing.recipe : recipeForOptionChoice(product, option, index);
              const metrics = variantFinancialMetrics(product, option, index, recipe);
              return `
                <details class="variant-recipe ${choice.active === false ? "is-cancelled" : ""}" data-variant-recipe data-option-id="${escapeAttr(option.id)}" data-option-label="${escapeAttr(option.label)}" data-choice-label="${escapeAttr(choice.label)}">
                  <summary>
                    <span>${escapeHtml(option.label)}: ${escapeHtml(choice.label)}</span>
                    <strong>${variantSummaryText({
                      active: choice.active !== false,
                      recipeCount: recipe.length,
                      margin: metrics.margin,
                    })}</strong>
                  </summary>
                  <div class="variant-recipe-body">
                    <label class="check-toggle">
                      <input type="checkbox" data-variant-active ${choice.active === false ? "" : "checked"} />
                      <span>Disponible en venta</span>
                    </label>
                    <div class="recipe-row-list" data-variant-row-list>
                      ${renderRecipeRowsFromRecipe(recipe, {
                        itemAttr: "data-variant-item",
                        qtyAttr: "data-variant-qty",
                        minRows: Math.max(4, recipe.length),
                      })}
                    </div>
                    <button class="secondary-button compact" type="button" data-add-variant-row>${svg("plus")}Anadir insumo</button>
                  </div>
                </details>
              `;
            })
            .join(""),
        )
        .join("")}
      </div>
    </section>
  `;
}

function renderMenuProductModal(product = null) {
  const isEdit = Boolean(product);
  const sectionOptions = [...new Set(activeMenuProducts().map((item) => item.section))];
  const subsectionOptions = [...new Set(activeMenuProducts().map((item) => item.subsection))];
  const iconOptions = ["plate", "bowl", "empanada", "steam", "fry", "dessert", "cup"];
  const basePrice = product ? menuProductBasePriceFromGross(product.price) : 0;
  return `
    <section class="panel modal-panel menu-product-modal">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">${isEdit ? "Editar platillo" : "Nuevo platillo"}</h2>
          <p class="panel-kicker">${isEdit ? escapeHtml(product.name) : "Catalogo, precio y receta de inventario"}</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-menu-product-form data-product-id="${product?.id || ""}">
        <label class="field">
          <span>Nombre</span>
          <input name="name" required value="${escapeAttr(product?.name || "")}" placeholder="Nombre del platillo" />
        </label>
        <div class="field-row">
          <label class="field">
            <span>Categoria</span>
            <input name="section" list="menu-section-options" required value="${escapeAttr(product?.section || state.activeSection || "Especiales")}" />
            <datalist id="menu-section-options">
              ${sectionOptions.map((section) => `<option value="${escapeAttr(section)}"></option>`).join("")}
            </datalist>
          </label>
          <label class="field">
            <span>Subcategoria</span>
            <input name="subsection" list="menu-subsection-options" required value="${escapeAttr(product?.subsection || "Temporada")}" />
            <datalist id="menu-subsection-options">
              ${subsectionOptions.map((subsection) => `<option value="${escapeAttr(subsection)}"></option>`).join("")}
            </datalist>
          </label>
        </div>
        <div class="field-row">
          <label class="field">
            <span>Precio base sin IVA</span>
            <input name="price" data-menu-product-base-price type="number" min="0" step="0.01" required value="${product ? formatPlainNumber(basePrice) : ""}" />
            <small>LibrePOS suma el IVA al guardar si esta activo.</small>
          </label>
          <label class="field">
            <span>Icono</span>
            <select name="icon">
              ${iconOptions.map((icon) => `<option value="${icon}" ${(product?.icon || "plate") === icon ? "selected" : ""}>${icon}</option>`).join("")}
            </select>
          </label>
        </div>
        ${renderMenuProductPricePreview(basePrice)}
        <label class="field">
          <span>Descripcion</span>
          <input name="description" value="${escapeAttr(product?.description || "")}" placeholder="Detalle corto para el menu" />
        </label>
        <label class="check-toggle">
          <input name="active" type="checkbox" ${product?.active === false ? "" : "checked"} />
          <span>Disponible en venta</span>
        </label>
        <section class="recipe-editor">
          <div class="recipe-editor-head">
            <strong>${svg("inventory")}Receta por unidad</strong>
            <span>${product ? money.format(productRecipeCost(product)) : "Costo al guardar"}</span>
          </div>
          <div class="recipe-row-list" data-recipe-row-list>
            ${renderRecipeRows(product)}
          </div>
          <button class="secondary-button compact" type="button" data-add-recipe-row>${svg("plus")}Anadir insumo</button>
        </section>
        ${renderVariantRecipeEditor(product || { options: [], recipe: [] })}
        <template data-recipe-row-template>
          ${renderRecipeRowsFromRecipe([], { minRows: 1 })}
        </template>
        <button class="primary-button" type="submit">${svg("check")}${isEdit ? "Guardar cambios" : "Crear platillo"}</button>
      </form>
    </section>
  `;
}

function renderIngredientModal(item = null, presetCategory = "") {
  const isEdit = Boolean(item);
  const inventory = currentInventory();
  const categories = ingredientCategoryNames();
  const units = [...new Set(inventory.map((entry) => entry.unit))].sort((a, b) => a.localeCompare(b, "es"));
  const history = normalizeCostHistory(item?.costHistory).slice(0, 6);
  const category = item?.category || presetCategory || "GENERAL";
  const recipeEligible = item ? isRecipeIngredient(item) : categoryRecipeEligible(category);
  return `
    <section class="panel modal-panel menu-product-modal">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">${isEdit ? "Editar insumo" : "Nuevo insumo"}</h2>
          <p class="panel-kicker">${isEdit ? escapeHtml(item.name) : "Catalogo de insumos, no inventario fisico"}</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-ingredient-form data-ingredient-id="${item?.id || ""}">
        <div class="field-row">
          <label class="field">
            <span>Categoria</span>
            <input name="category" list="ingredient-category-options" required value="${escapeAttr(category)}" />
            <datalist id="ingredient-category-options">
              ${categories.map((category) => `<option value="${escapeAttr(category)}"></option>`).join("")}
            </datalist>
          </label>
          <label class="field">
            <span>Insumo</span>
            <input name="name" required value="${escapeAttr(item?.name || "")}" placeholder="POLLO" />
          </label>
        </div>
        <div class="field-row">
          <label class="field">
            <span>Proveedor</span>
            <input name="supplier" required value="${escapeAttr(item?.supplier || "Sin proveedor")}" placeholder="MERCADO" />
          </label>
          <label class="field">
            <span>Unidad</span>
            <input name="unit" list="ingredient-unit-options" required value="${escapeAttr(item?.unit || "PZ")}" />
            <datalist id="ingredient-unit-options">
              ${units.map((unit) => `<option value="${escapeAttr(unit)}"></option>`).join("")}
            </datalist>
          </label>
        </div>
        <div class="field-row">
          <label class="field">
            <span>Costo vigente</span>
            <input name="unitCost" type="number" min="0" step="0.01" required value="${formatPlainNumber(item?.unitCost || 0)}" />
          </label>
          <label class="field">
            <span>Motivo del cambio</span>
            <input name="reason" placeholder="Compra, cambio proveedor, correccion" />
          </label>
        </div>
        <label class="check-toggle">
          <input name="recipeEligible" type="checkbox" ${recipeEligible ? "checked" : ""} />
          <span>Disponible para recetas</span>
        </label>
        ${
          history.length
            ? `
              <section class="cost-history-box">
                <h3 class="mini-title">Historial de costo</h3>
                ${history
                  .map(
                    (entry) => `
                      <div class="history-row compact-history">
                        <span>${svg("clock")}</span>
                        <div>
                          <strong>${money.format(entry.previousCost)} -> ${money.format(entry.nextCost)}</strong>
                          <p>${formatDateTime(entry.changedAt)} · ${escapeHtml(waiterName(entry.changedBy) || "Sistema")} · ${escapeHtml(entry.reason)}</p>
                        </div>
                      </div>
                    `,
                  )
                  .join("")}
              </section>
            `
            : ""
        }
        <button class="primary-button" type="submit">${svg("check")}${isEdit ? "Guardar insumo" : "Crear insumo"}</button>
      </form>
    </section>
  `;
}

function renderExtraModal(extra = null) {
  const isEdit = Boolean(extra);
  const inventory = [...currentInventory()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const selectedItem = extra ? extraInventoryItem(extra) : inventory[0];
  return `
    <section class="panel modal-panel menu-product-modal">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">${isEdit ? "Editar extra" : "Nuevo extra"}</h2>
          <p class="panel-kicker">${isEdit ? escapeHtml(extra.name) : "Precio de venta y descuento de inventario"}</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-extra-form data-extra-id="${extra?.id || ""}">
        <label class="field">
          <span>Extra</span>
          <input name="name" required value="${escapeAttr(extra?.name || "")}" placeholder="Queso extra, salsa, crema" />
        </label>
        <div class="field-row">
          <label class="field">
            <span>Precio venta</span>
            <input name="price" type="number" min="0" step="0.01" required value="${extra ? formatPlainNumber(extra.price) : ""}" />
          </label>
          <label class="field">
            <span>Gramaje/cantidad</span>
            <input name="qty" type="number" min="0.001" step="0.001" required value="${extra ? formatPlainNumber(extra.qty) : ""}" placeholder="0.050" />
          </label>
        </div>
        <label class="field">
          <span>Insumo que descuenta</span>
          <select name="inventoryItemId" required ${inventory.length ? "" : "disabled"}>
            ${inventory
              .map(
                (item) => `
                  <option value="${item.id}" ${item.id === selectedItem?.id ? "selected" : ""}>
                    ${escapeHtml(item.name)} · ${formatNumber(item.qty)} ${escapeHtml(item.unit)} · ${money.format(item.unitCost)}/${escapeHtml(item.unit)}
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>
        <div class="checkout-warning">
          ${svg("alert")}Aviso: cada vez que se venda este extra, LibrePOS descontara la cantidad indicada del insumo seleccionado.
        </div>
        <label class="check-toggle">
          <input name="active" type="checkbox" ${extra?.active === false ? "" : "checked"} />
          <span>Disponible para venta</span>
        </label>
        <button class="primary-button" type="submit" ${inventory.length ? "" : "disabled"}>${svg("check")}${isEdit ? "Guardar extra" : "Crear extra"}</button>
      </form>
    </section>
  `;
}

function renderIngredientCategoryModal() {
  const categories = ingredientCategoryNames();
  return `
    <section class="panel modal-panel menu-product-modal">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Nueva categoria</h2>
          <p class="panel-kicker">Clasifica insumos de comida o administrativos.</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-ingredient-category-form>
        <label class="field">
          <span>Nombre de categoria</span>
          <input name="category" required list="ingredient-category-options" placeholder="Ej. UNIFORMES, PAPELERIA, LACTEOS" />
          <datalist id="ingredient-category-options">
            ${categories.map((category) => `<option value="${escapeAttr(category)}"></option>`).join("")}
          </datalist>
        </label>
        <label class="check-toggle">
          <input name="nonRecipe" type="checkbox" />
          <span>No-comida / no-receta</span>
        </label>
        <button class="primary-button" type="submit">${svg("check")}Crear categoria</button>
      </form>
    </section>
  `;
}

function renderCashRegister() {
  if (!hasCashAccess()) return "";
  const activeSession = currentCashSession();
  const todayPayments = paymentTotalsForSales(state.sales.filter((sale) => isSameLocalDay(saleClosedAt(sale))));
  const activeTotals = cashSessionTotals(activeSession);
  const lastCut = lastClosedCashSession();
  return `
    <div class="cash-layout">
      <section class="board-header">
        <div>
          <h2>Caja</h2>
          <p>Apertura, efectivo, tarjeta y corte de turno</p>
        </div>
        <span class="stat-pill">${activeSession ? "Caja abierta" : "Caja cerrada"}</span>
      </section>
      <section class="summary-grid">
        ${renderSummaryCard("Estado", activeSession ? `Abierta ${formatTime(activeSession.openedAt)}` : "Cerrada")}
        ${renderSummaryCard("Total hoy", money.format(todayPayments.total))}
        ${renderSummaryCard("IVA hoy", money.format(todayPayments.iva || 0))}
        ${renderSummaryCard("Efectivo hoy", money.format(todayPayments.cash))}
        ${renderSummaryCard("Tarjeta hoy", money.format(todayPayments.card))}
        ${renderSummaryCard("Ultimo corte", lastCut ? money.format(Number(lastCut.difference) || 0) : "Sin corte")}
      </section>
      <div class="cash-grid">
        ${
          activeSession
            ? renderCashClosePanel(activeSession, activeTotals)
            : `
              <section class="panel">
                <div class="panel-header">
                  <div>
                    <h2 class="panel-title">Apertura de caja</h2>
                    <p class="panel-kicker">Fondo inicial antes de cobrar</p>
                  </div>
                </div>
                <form class="panel-body field-grid" data-cash-open-form>
                  <label class="field">
                    <span>Fondo inicial</span>
                    <input name="openingCash" type="number" min="0" step="0.01" value="0" required />
                  </label>
                  <label class="field">
                    <span>Nota opcional</span>
                    <input name="note" placeholder="Cambio inicial, turno o responsable" />
                  </label>
                  <button class="primary-button" type="submit">${svg("cash")}Abrir caja</button>
                </form>
              </section>
            `
        }
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Resumen de caja</h2>
              <p class="panel-kicker">${activeSession ? `Desde ${formatDateTime(activeSession.openedAt)}` : "Sin caja abierta"}</p>
            </div>
          </div>
          <div class="panel-body metric-stack">
            <div class="total-line"><span>Fondo inicial</span><strong>${money.format(activeTotals.openingCash || 0)}</strong></div>
            <div class="total-line"><span>Total cobrado</span><strong>${money.format(activeTotals.total || 0)}</strong></div>
            <div class="total-line"><span>IVA incluido</span><strong>${money.format(activeTotals.iva || 0)}</strong></div>
            <div class="total-line"><span>Ventas efectivo</span><strong>${money.format(activeTotals.cash || 0)}</strong></div>
            <div class="total-line"><span>Ventas tarjeta</span><strong>${money.format(activeTotals.card || 0)}</strong></div>
            <div class="total-line"><span>Tickets insumos</span><strong>${money.format(activeTotals.cashExpenses || 0)}</strong></div>
            <div class="total-line"><span>Propinas incluidas</span><strong>${money.format(activeTotals.tips || 0)}</strong></div>
            <div class="total-line grand"><span>Efectivo esperado</span><strong>${money.format(activeTotals.expectedCash || 0)}</strong></div>
          </div>
        </section>
      </div>
      ${activeSession ? renderCashSessionSales(activeSession) : ""}
      ${renderCashSessionHistory()}
    </div>
  `;
}

function renderCashClosePanel(session, totals) {
  const openOrders = getOpenOrders().length;
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Corte de caja</h2>
          <p class="panel-kicker">Cuenta el efectivo fisico y cierra el turno</p>
        </div>
      </div>
      <form class="panel-body field-grid" data-cash-close-form data-session-id="${session.id}">
        ${openOrders ? `<div class="checkout-warning">${svg("alert")}Hay ${openOrders} orden${openOrders === 1 ? "" : "es"} abierta${openOrders === 1 ? "" : "s"}. Cierra o cancela antes del corte.</div>` : ""}
        <div class="cash-cut-preview">
          <div><span>Total cobrado</span><strong>${money.format(totals.total)}</strong></div>
          <div><span>IVA incluido</span><strong>${money.format(totals.iva || 0)}</strong></div>
          <div><span>Efectivo esperado</span><strong>${money.format(totals.expectedCash)}</strong></div>
          <div><span>Tarjeta cobrada</span><strong>${money.format(totals.card)}</strong></div>
          <div><span>Tickets insumos</span><strong>${money.format(totals.cashExpenses || 0)}</strong></div>
        </div>
        <label class="field">
          <span>Efectivo contado</span>
          <input name="countedCash" type="number" min="0" step="0.01" value="${totals.expectedCash.toFixed(2)}" required />
        </label>
        <label class="field">
          <span>Nota opcional</span>
          <input name="note" placeholder="Faltante, sobrante o terminal bancaria" />
        </label>
        <button class="cash-close-button" type="submit" ${openOrders ? "disabled" : ""}>${svg("check")}Cerrar caja y finalizar turno</button>
      </form>
    </section>
  `;
}

function renderCashSessionSales(session) {
  const sales = salesForCashSession(session);
  return `
    <section class="panel data-grid-wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Cobros de la caja abierta</h2>
          <p class="panel-kicker">${sales.length} ticket${sales.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div class="panel-body table-wrap">
        <table class="data-table">
          <thead><tr><th>UID</th><th>Hora</th><th>Orden</th><th>Cajero</th><th>Pago</th><th>IVA</th><th>Propina</th><th>Recibido</th><th>Cambio</th><th>Total</th></tr></thead>
          <tbody>
            ${
              sales.length
                ? sales
                    .map(
                      (sale) => {
                        const cashDue = Number(sale.payment?.cashDue) || 0;
                        return `
                          <tr>
                            <td><strong>${escapeHtml(paymentUidForSale(sale) || "-")}</strong><small>ID ${escapeHtml(orderNumberLabel(sale, ""))}</small></td>
                            <td>${formatDateTime(saleClosedAt(sale))}</td>
                            <td><strong>${escapeHtml(sale.label || "Venta")}</strong></td>
                            <td>${escapeHtml(waiterName(sale.cashierId))}</td>
                            <td>${escapeHtml(sale.paymentMethod || "Efectivo")}</td>
                            <td>${money.format(saleIvaAmount(sale))}</td>
                            <td>${money.format(saleTip(sale))}<small>${escapeHtml(saleTipPaymentMethod(sale))}</small></td>
                            <td>${cashDue > 0 ? money.format(Number(sale.payment?.cashReceived) || 0) : "-"}</td>
                            <td>${cashDue > 0 ? money.format(Number(sale.payment?.changeGiven) || 0) : "-"}</td>
                            <td><strong>${money.format(saleTotal(sale))}</strong></td>
                          </tr>
                        `;
                      },
                    )
                    .join("")
                : `<tr><td colspan="10">Aun no hay cobros en esta caja.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderCashSessionHistory() {
  const sessions = [...normalizeCashSessions(state.cashSessions)]
    .sort((a, b) => new Date(b.closedAt || b.openedAt) - new Date(a.closedAt || a.openedAt))
    .slice(0, 20);
  return `
    <section class="panel data-grid-wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Historial de cortes</h2>
          <p class="panel-kicker">Aperturas y cierres recientes</p>
        </div>
      </div>
      <div class="panel-body table-wrap">
        <table class="data-table">
          <thead><tr><th>Apertura</th><th>Cierre</th><th>Usuario</th><th>Total</th><th>IVA</th><th>Efectivo</th><th>Tarjeta</th><th>Contado</th><th>Diferencia</th></tr></thead>
          <tbody>
            ${
              sessions.length
                ? sessions
                    .map((session) => {
                      const totals = cashSessionDisplayTotals(session);
                      return `
                        <tr>
                          <td>${formatDateTime(session.openedAt)}</td>
                          <td>${session.closedAt ? formatDateTime(session.closedAt) : "Abierta"}</td>
                          <td><strong>${escapeHtml(waiterName(session.openedBy))}</strong><small>${session.closedBy ? `Cerro ${escapeHtml(waiterName(session.closedBy))}` : ""}</small></td>
                          <td>${money.format(Number(totals.totalSales ?? totals.total) || 0)}</td>
                          <td>${money.format(Number(totals.iva) || 0)}</td>
                          <td>${money.format(Number(totals.cashSales ?? totals.cash) || 0)}</td>
                          <td>${money.format(Number(totals.cardSales ?? totals.card) || 0)}</td>
                          <td>${session.status === "closed" ? money.format(Number(session.countedCash) || 0) : "Pendiente"}</td>
                          <td><strong>${session.status === "closed" ? money.format(Number(session.difference) || 0) : "Pendiente"}</strong></td>
                        </tr>
                      `;
                    })
                    .join("")
                : `<tr><td colspan="9">Aun no hay aperturas de caja.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function expensePeriodKey(expense, period) {
  const date = new Date(expense.createdAt);
  const year = date.getFullYear();
  const month = date.getMonth();
  if (period === "quincena") {
    return `${year}-${String(month + 1).padStart(2, "0")} Q${date.getDate() <= 15 ? "1" : "2"}`;
  }
  if (period === "trimestre") {
    return `${year} T${Math.floor(month / 3) + 1}`;
  }
  return new Intl.DateTimeFormat("es-MX", { month: "short", year: "numeric" }).format(date);
}

function summarizeExpensesBy(expenses, keyFn) {
  const map = new Map();
  expenses.forEach((expense) => {
    const key = keyFn(expense);
    const current = map.get(key) || { label: key, amount: 0, count: 0 };
    current.amount += Number(expense.amount) || 0;
    current.count += 1;
    map.set(key, current);
  });
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

function cashClosuresByDay() {
  const map = new Map();
  normalizeCashSessions(state.cashSessions)
    .filter((session) => session.status === "closed")
    .forEach((session) => {
      const totals = cashSessionDisplayTotals(session);
      const closeDate = new Date(session.closedAt || session.openedAt);
      const key = localDateKey(closeDate);
      const current = map.get(key) || {
        date: closeDate.toLocaleDateString("es-MX"),
        sortKey: key,
        sessions: 0,
        total: 0,
        iva: 0,
        cash: 0,
        card: 0,
        counted: 0,
        difference: 0,
      };
      current.sessions += 1;
      current.total += Number(totals.totalSales ?? totals.total) || 0;
      current.iva += Number(totals.iva) || 0;
      current.cash += Number(totals.cashSales ?? totals.cash) || 0;
      current.card += Number(totals.cardSales ?? totals.card) || 0;
      current.counted += Number(session.countedCash) || 0;
      current.difference += Number(session.difference) || 0;
      map.set(key, current);
    });
  return [...map.values()].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

function renderDataExports() {
  if (!isAdminUser()) return "";
  return `
    <section class="panel data-grid-wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Exportar datos</h2>
          <p class="panel-kicker">CSV para Excel y respaldo JSON</p>
        </div>
      </div>
      <div class="panel-body export-grid">
        <button class="secondary-button" data-export-data="ventas">${svg("data")}Ventas CSV</button>
        <button class="secondary-button" data-export-data="caja">${svg("cash")}Cortes CSV</button>
        <button class="secondary-button" data-export-data="gastos">${svg("cash")}Gastos CSV</button>
        <button class="secondary-button" data-export-data="inventario">${svg("inventory")}Inventario CSV</button>
        <button class="primary-button" data-export-data="respaldo">${svg("digital")}Respaldo JSON</button>
      </div>
    </section>
  `;
}

function renderExpenseControls() {
  if (!isAdminUser()) return "";
  const today = new Date().toISOString().slice(0, 10);
  const expenses = normalizeExpenses(state.expenses);
  const bySupplier = summarizeExpensesBy(expenses, (expense) => expense.supplier).slice(0, 12);
  const byFortnight = summarizeExpensesBy(expenses, (expense) => expensePeriodKey(expense, "quincena")).slice(0, 8);
  const byMonth = summarizeExpensesBy(expenses, (expense) => expensePeriodKey(expense, "mes")).slice(0, 8);
  const byQuarter = summarizeExpensesBy(expenses, (expense) => expensePeriodKey(expense, "trimestre")).slice(0, 8);
  return `
    <section class="panel data-grid-wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Gastos</h2>
          <p class="panel-kicker">Proveedor, quincena, mes y trimestre</p>
        </div>
      </div>
      <div class="panel-body expense-layout">
        <form class="field-grid expense-form" data-expense-form>
          <div class="field-row">
            <label class="field"><span>Proveedor</span><input name="supplier" required placeholder="MERCADO" /></label>
            <label class="field"><span>Concepto</span><input name="name" required placeholder="Compra de insumos" /></label>
          </div>
          <div class="field-row">
            <label class="field"><span>Categoria</span><input name="category" placeholder="Insumos" /></label>
            <label class="field"><span>Fecha</span><input name="date" type="date" value="${today}" /></label>
          </div>
          <div class="field-row">
            <label class="field"><span>Importe</span><input name="amount" type="number" min="0" step="0.01" required /></label>
            <label class="field"><span>Nota</span><input name="note" placeholder="Factura, ticket o detalle" /></label>
          </div>
          <button class="primary-button" type="submit">${svg("plus")}Registrar gasto</button>
        </form>
        <div class="expense-summary-grid">
          ${renderExpenseSummaryTable("Por proveedor", bySupplier)}
          ${renderExpenseSummaryTable("Por quincena", byFortnight)}
          ${renderExpenseSummaryTable("Por mes", byMonth)}
          ${renderExpenseSummaryTable("Por trimestre", byQuarter)}
        </div>
      </div>
    </section>
  `;
}

function renderExpenseSummaryTable(title, rows) {
  return `
    <section class="mini-table">
      <h3>${escapeHtml(title)}</h3>
      <div>
        ${
          rows.length
            ? rows
                .map(
                  (row) => `
                    <div class="mini-table-row">
                      <span>${escapeHtml(row.label)}<small>${row.count} registro${row.count === 1 ? "" : "s"}</small></span>
                      <strong>${money.format(row.amount)}</strong>
                    </div>
                  `,
                )
                .join("")
            : `<div class="empty-state compact">Sin gastos.</div>`
        }
      </div>
    </section>
  `;
}

function renderCashClosuresData() {
  const rows = cashClosuresByDay();
  return `
    <section class="panel data-grid-wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Cierres de caja por dia</h2>
          <p class="panel-kicker">Total, IVA, efectivo, tarjeta y diferencias documentadas</p>
        </div>
      </div>
      <div class="panel-body table-wrap">
        <table class="data-table">
          <thead><tr><th>Dia</th><th>Cortes</th><th>Total</th><th>IVA</th><th>Efectivo</th><th>Tarjeta</th><th>Contado</th><th>Diferencia</th></tr></thead>
          <tbody>
            ${
              rows.length
                ? rows
                    .map(
                      (row) => `
                        <tr>
                          <td><strong>${escapeHtml(row.date)}</strong></td>
                          <td>${row.sessions}</td>
                          <td>${money.format(row.total)}</td>
                          <td>${money.format(row.iva)}</td>
                          <td>${money.format(row.cash)}</td>
                          <td>${money.format(row.card)}</td>
                          <td>${money.format(row.counted)}</td>
                          <td><strong>${money.format(row.difference)}</strong></td>
                        </tr>
                      `,
                    )
                    .join("")
                : `<tr><td colspan="8">Aun no hay cortes de caja cerrados.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function printerChoiceName() {
  const select = document.querySelector("[data-printer-select]");
  return String(select?.value || "").trim();
}

function manualPrinterName() {
  const input = document.querySelector("[data-printer-manual]");
  return cleanUserText(input?.value || printerRuntime.manualName);
}

function printerCandidateName() {
  return manualPrinterName() || printerChoiceName();
}

function commandPrinterChoiceName() {
  const select = document.querySelector("[data-command-printer-select]");
  return String(select?.value || "").trim();
}

function manualCommandPrinterName() {
  const input = document.querySelector("[data-command-printer-manual]");
  return cleanUserText(input?.value || printerRuntime.manualCommandName);
}

function commandPrinterCandidateName() {
  return manualCommandPrinterName() || commandPrinterChoiceName();
}

function renderedPrinterValue() {
  const selectedTicketPrinter = selectedTicketPrinterName();
  if (selectedTicketPrinter) return selectedTicketPrinter;
  const ticketPrinter = printerRuntime.printers.find((printer) => printer.isTicketLikely);
  const defaultPrinter = printerRuntime.printers.find((printer) => printer.isDefault);
  return ticketPrinter?.name || defaultPrinter?.name || printerRuntime.printers[0]?.name || "";
}

function renderedCommandPrinterValue() {
  const selectedCommandPrinter = selectedCommandPrinterName();
  if (selectedCommandPrinter) return selectedCommandPrinter;
  const ticketPrinter = printerRuntime.printers.find((printer) => printer.isTicketLikely);
  const defaultPrinter = printerRuntime.printers.find((printer) => printer.isDefault);
  return ticketPrinter?.name || defaultPrinter?.name || printerRuntime.printers[0]?.name || "";
}

function renderPrinterOptions() {
  const selected = renderedPrinterValue();
  const options = [];
  if (selected && !printerRuntime.printers.some((printer) => printer.name === selected)) {
    options.push(`<option value="${escapeAttr(selected)}" selected>${escapeHtml(selected)} (tickets)</option>`);
  }
  printerRuntime.printers.forEach((printer) => {
    const details = [printer.portName, printer.driverName].filter(Boolean).join(" · ");
    const status = printer.workOffline ? " · offline" : "";
    options.push(`
      <option value="${escapeAttr(printer.name)}" ${printer.name === selected ? "selected" : ""}>
        ${escapeHtml(printer.name)}${printer.isTicketLikely ? " (sugerida)" : printer.isDefault ? " (predeterminada)" : ""}${details ? ` · ${escapeHtml(details)}` : ""}${status}
      </option>
    `);
  });
  if (options.length) return options.join("");
  if (printerRuntime.loading) return `<option value="">Buscando impresoras...</option>`;
  return `<option value="">Sin impresoras detectadas</option>`;
}

function renderCommandPrinterOptions() {
  const selected = renderedCommandPrinterValue();
  const options = [];
  if (selected && !printerRuntime.printers.some((printer) => printer.name === selected)) {
    options.push(`<option value="${escapeAttr(selected)}" selected>${escapeHtml(selected)} (comandas)</option>`);
  }
  printerRuntime.printers.forEach((printer) => {
    const details = [printer.portName, printer.driverName].filter(Boolean).join(" · ");
    const status = printer.workOffline ? " · offline" : "";
    options.push(`
      <option value="${escapeAttr(printer.name)}" ${printer.name === selected ? "selected" : ""}>
        ${escapeHtml(printer.name)}${printer.isTicketLikely ? " (sugerida)" : printer.isDefault ? " (predeterminada)" : ""}${details ? ` · ${escapeHtml(details)}` : ""}${status}
      </option>
    `);
  });
  if (options.length) return options.join("");
  if (printerRuntime.loading) return `<option value="">Buscando impresoras...</option>`;
  return `<option value="">Sin impresoras detectadas</option>`;
}

function receiptTextWithLogoMarker(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const normalizedLines = lines.map((line) => {
    if (line === RECEIPT_LOGO_MARKER) return receiptPrintCenter("LibrePOS");
    if (isReceiptBrandTitle(line)) return receiptPrintCenter(RECEIPT_BRAND_TITLE);
    return line;
  });
  if (!ticketLogoEnabled()) return normalizedLines.join("\n");
  const withoutLibrePos = normalizedLines.filter((line) => line.trim() !== "LibrePOS");
  const titleIndex = withoutLibrePos.findIndex(isReceiptBrandTitle);
  if (titleIndex >= 0) {
    withoutLibrePos[titleIndex] = receiptPrintCenter(RECEIPT_BRAND_TITLE);
    const markerIndex = ticketLogoPosition() === "above-title" ? titleIndex : titleIndex + 1;
    withoutLibrePos.splice(markerIndex, 0, RECEIPT_LOGO_MARKER);
    return withoutLibrePos.join("\n");
  }
  return withoutLibrePos.join("\n");
}

function isReceiptBrandTitle(line) {
  const title = receiptPrintSanitize(line);
  return title === "LIBREPOS" || title === RECEIPT_BRAND_TITLE;
}

function receiptBrandLines() {
  const titleLine = receiptPrintCenter(RECEIPT_BRAND_TITLE);
  const textLogoLine = receiptPrintCenter("LibrePOS");
  if (!ticketLogoEnabled()) return [titleLine, textLogoLine];
  return ticketLogoPosition() === "above-title"
    ? [RECEIPT_LOGO_MARKER, titleLine]
    : [titleLine, RECEIPT_LOGO_MARKER];
}

function ticketLogoPreviewWidthPx() {
  return Math.round(ticketLogoWidthMm() * 3.2);
}

function refreshTicketLogoPreviewSize() {
  document.querySelectorAll("[data-ticket-logo-preview-img]").forEach((image) => {
    image.style.width = `${ticketLogoPreviewWidthPx()}px`;
  });
}

function ticketMarginPreviewPx(value) {
  return `${Math.round(14 + (value * 3.2))}px`;
}

function ticketMarginPreviewStyle() {
  return `style="--ticket-margin-left: ${ticketMarginPreviewPx(ticketMarginLeftMm())}; --ticket-margin-right: ${ticketMarginPreviewPx(ticketMarginRightMm())};"`;
}

function refreshTicketMarginPreview() {
  document.querySelector("[data-printer-panel]")?.style.setProperty("--ticket-margin-left", ticketMarginPreviewPx(ticketMarginLeftMm()));
  document.querySelector("[data-printer-panel]")?.style.setProperty("--ticket-margin-right", ticketMarginPreviewPx(ticketMarginRightMm()));
}

function renderReceiptPreviewHtml(text) {
  const value = String(text || "");
  if (!value) {
    return `<div class="printer-receipt-preview printer-receipt-placeholder">Genera una cuenta falsa para previsualizar el ticket.</div>`;
  }
  const lines = receiptTextWithLogoMarker(value).split("\n");
  return `
    <div class="printer-receipt-preview">
      ${lines.map((line) => {
        if (line === RECEIPT_LOGO_MARKER) {
          return `
            <div class="printer-receipt-logo-row">
              <img data-ticket-logo-preview-img src="${escapeAttr(ticketLogoSrc())}" alt="Logo ticket" style="width: ${ticketLogoPreviewWidthPx()}px" />
            </div>
          `;
        }
        if (isReceiptBrandTitle(line)) {
          return `<div class="printer-receipt-line printer-receipt-title-line">${escapeHtml(line.trim())}</div>`;
        }
        return `<div class="printer-receipt-line">${line ? escapeHtml(line) : "&nbsp;"}</div>`;
      }).join("")}
    </div>
  `;
}

function renderCommandReceiptPreviewHtml(text) {
  const value = String(text || "");
  if (!value) {
    return `<div class="printer-receipt-preview printer-receipt-placeholder">Genera una comanda para previsualizarla.</div>`;
  }
  const lines = value.split("\n");
  return `
    <div class="printer-receipt-preview">
      ${lines.map((line) => `<div class="printer-receipt-line">${line ? escapeHtml(line) : "&nbsp;"}</div>`).join("")}
    </div>
  `;
}

function configTabs() {
  return [
    ["general", "General"],
    ["printing", "Impresion"],
  ];
}

function printingTabs() {
  return [
    ["tickets", "Tickets"],
    ["commands", "Comandas"],
  ];
}

function activeConfigTab() {
  return state.configTab === "printing" ? "printing" : "general";
}

function activePrintingTab() {
  return state.printingTab === "commands" ? "commands" : "tickets";
}

function isPrintingConfigView() {
  return currentUser() && state.view === "config" && activeConfigTab() === "printing";
}

function setConfigTab(tab) {
  state.configTab = tab === "printing" ? "printing" : "general";
  persist();
  render();
}

function setPrintingTab(tab) {
  state.printingTab = tab === "commands" ? "commands" : "tickets";
  persist();
  render();
}

function renderConfig() {
  if (!isAdminUser()) return "";
  const active = activeConfigTab();
  return `
    <div class="data-layout config-layout">
      <section class="board-header">
        <div>
          <h2>Configuracion</h2>
          <p>Parametros generales e impresion de tickets</p>
        </div>
        <span class="stat-pill">${active === "printing" ? "Impresion" : "General"}</span>
      </section>
      <section class="panel data-grid-wide config-tabs-panel">
        <div class="panel-body">
          <div class="chip-row compact-chip-row">
            ${configTabs()
              .map(([id, label]) => `
                <button class="chip ${active === id ? "is-active" : ""}" data-config-tab="${id}" type="button">
                  ${escapeHtml(label)}
                </button>
              `)
              .join("")}
          </div>
        </div>
      </section>
      ${active === "printing" ? renderPrinterTest() : renderGeneralConfig()}
    </div>
  `;
}

function renderGeneralConfig() {
  const enabled = currentIvaEnabled();
  const rate = currentIvaRate();
  const ratePercent = formatPlainNumber(rate * 100);
  const folioPlan = resetFolioPlan();
  const pricePlan = ivaPriceConversionPlan();
  return `
    <section class="summary-grid">
      ${renderSummaryCard("IVA", enabled ? "Activo" : "Inactivo", enabled ? "ok" : "")}
      ${renderSummaryCard("Porcentaje", `${ratePercent}%`)}
      ${renderSummaryCard("Ventas antiguas", "IVA 0")}
    </section>
    <section class="panel data-grid-wide config-general-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">General</h2>
          <p class="panel-kicker">El IVA se aplica solo a ordenes nuevas abiertas con IVA activo.</p>
        </div>
      </div>
      <div class="panel-body field-grid">
        <label class="field printer-logo-toggle">
          <span>Activar IVA</span>
          <input data-iva-enabled type="checkbox" ${enabled ? "checked" : ""} />
          <small>Las ventas antiguas sin IVA guardado permanecen con IVA 0.</small>
        </label>
        <label class="field">
          <span>Porcentaje IVA</span>
          <input data-iva-rate type="number" min="0" max="100" step="0.01" value="${ratePercent}" />
          <small>Valor usado por defecto: 16%. Se guarda como porcentaje para nuevas ordenes.</small>
        </label>
      </div>
    </section>
    <section class="panel data-grid-wide config-general-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Folios de facturacion</h2>
          <p class="panel-kicker">Renombra folios actuales y vuelve a iniciar el consecutivo desde 1.</p>
        </div>
      </div>
      <div class="panel-body field-grid">
        <div class="context-grid">
          <span><strong>Siguiente folio</strong>${nextOrderNumber()}</span>
          <span><strong>Folios a renombrar</strong>${folioPlan.count}</span>
          <span><strong>Prefijo disponible</strong>${escapeHtml(folioPlan.prefix)}</span>
          <span><strong>Despues del reset</strong>1</span>
        </div>
        <p class="muted-text compact-text">
          Al resetear, los folios numericos existentes pasan a ${escapeHtml(folioPlan.prefix)}1, ${escapeHtml(folioPlan.prefix)}2, ${escapeHtml(folioPlan.prefix)}3... y las nuevas ordenes vuelven a 1, 2, 3.
        </p>
        <button class="danger-button" data-open-modal="reset-folios" type="button" ${folioPlan.count ? "" : "disabled"}>
          ${svg("alert")}Resetear folios
        </button>
      </div>
    </section>
    <section class="panel data-grid-wide config-general-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Opciones avanzadas</h2>
          <p class="panel-kicker">Acciones puntuales de administracion fiscal y catalogo</p>
        </div>
      </div>
      <div class="panel-body field-grid">
        <details class="advanced-settings">
          <summary>Conversion de precios por IVA</summary>
          <div class="context-grid">
            <span><strong>IVA actual</strong>${escapeHtml(ivaLabel(pricePlan.rate))}</span>
            <span><strong>Productos</strong>${pricePlan.productsCount}</span>
            <span><strong>Extras</strong>${pricePlan.extrasCount}</span>
            <span><strong>Estado</strong>${pricePlan.alreadyApplied ? `Aplicado ${formatDateTime(state.settings.ivaBasePriceConversionAppliedAt)}` : "Pendiente"}</span>
          </div>
          <p class="muted-text compact-text">
            Convierte el catalogo para que el precio actual pase a ser base sin IVA. Ejemplo: un precio actual de $100.00 quedara como $${formatPlainNumber(convertBasePriceToGross(100, pricePlan.rate))}; el ticket mostrara $100.00 de base y ${escapeHtml(ivaLabel(pricePlan.rate))} aparte.
          </p>
          <button class="danger-button" data-open-modal="iva-price-conversion" type="button" ${pricePlan.enabled && pricePlan.candidatesCount && !pricePlan.alreadyApplied ? "" : "disabled"}>
            ${svg("alert")}Convertir precios base + IVA
          </button>
          <small>${pricePlan.enabled ? "Revisa los ejemplos antes de ejecutar." : "Activa IVA antes de convertir precios."}</small>
        </details>
      </div>
    </section>
  `;
}

function renderResetFoliosModal() {
  const plan = resetFolioPlan();
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Resetear folios</h2>
          <p class="panel-kicker">Accion administrativa irreversible para iniciar un nuevo consecutivo.</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-reset-folios-form>
        <div class="checkout-warning">
          ${svg("alert")}Se renombraran ${plan.count} folio${plan.count === 1 ? "" : "s"} numerico${plan.count === 1 ? "" : "s"} con el prefijo ${escapeHtml(plan.prefix)}. Las nuevas ordenes empezaran en 1.
        </div>
        <div class="context-grid">
          <span><strong>Ejemplo anterior</strong>1, 2, 3</span>
          <span><strong>Quedaran como</strong>${escapeHtml(plan.prefix)}1, ${escapeHtml(plan.prefix)}2, ${escapeHtml(plan.prefix)}3</span>
          <span><strong>Siguiente folio</strong>1</span>
          <span><strong>Prefijo usado</strong>${escapeHtml(plan.prefix)}</span>
        </div>
        <label class="field">
          <span>Escribe RESET para confirmar</span>
          <input name="confirm" autocomplete="off" placeholder="RESET" required />
          <small>Los datos, ventas e inventario se conservan; solo cambia el folio visible de pedidos existentes.</small>
        </label>
        <button class="danger-button" type="submit" ${plan.count ? "" : "disabled"}>
          ${svg("check")}Confirmar reset
        </button>
      </form>
    </section>
  `;
}

function renderIvaPriceConversionModal(modal = {}) {
  const plan = ivaPriceConversionPlan();
  const limit = Math.max(3, Number(modal?.exampleLimit) || 3);
  const seed = Number(modal?.exampleSeed) || Date.now();
  const examples = ivaPriceConversionExamples(limit, seed);
  return `
    <section class="panel modal-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Convertir precios base + IVA</h2>
          <p class="panel-kicker">Los precios actuales pasan a ser base sin IVA y el total sube por ${escapeHtml(ivaLabel(plan.rate))}.</p>
        </div>
        <button class="icon-button" data-close-modal-button title="Cerrar">${svg("minus")}</button>
      </div>
      <form class="panel-body field-grid" data-iva-price-conversion-form>
        <div class="checkout-warning">
          ${svg("alert")}Esta accion cambia el catalogo hacia delante. No modifica ordenes abiertas, ventas cerradas, inventario ni folios.
        </div>
        <div class="context-grid">
          <span><strong>IVA usado</strong>${escapeHtml(ivaLabel(plan.rate))}</span>
          <span><strong>Precios afectados</strong>${plan.candidatesCount}</span>
          <span><strong>Productos</strong>${plan.productsCount}</span>
          <span><strong>Extras</strong>${plan.extrasCount}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Tipo</th><th>Nombre</th><th>Actual base</th><th>IVA</th><th>Nuevo total</th></tr>
            </thead>
            <tbody>
              ${
                examples.length
                  ? examples.map((item) => `
                    <tr>
                      <td>${escapeHtml(item.kind)}</td>
                      <td>${escapeHtml(item.name)}</td>
                      <td>${money.format(item.price)}</td>
                      <td>${money.format(item.iva)}</td>
                      <td><strong>${money.format(item.nextPrice)}</strong></td>
                    </tr>
                  `).join("")
                  : `<tr><td colspan="5">No hay precios disponibles para convertir.</td></tr>`
              }
            </tbody>
          </table>
        </div>
        <button class="secondary-button" type="button" data-more-iva-price-examples ${examples.length >= plan.candidatesCount ? "disabled" : ""}>
          ${svg("plus")}Ver mas ejemplos
        </button>
        <label class="field">
          <span>Escribe IVA para confirmar</span>
          <input name="confirm" autocomplete="off" placeholder="IVA" ${plan.enabled && !plan.alreadyApplied ? "" : "disabled"} />
          <small>Ejemplo: $100.00 actual se guardara como ${money.format(convertBasePriceToGross(100, plan.rate))}; el ticket mostrara base $100.00 + ${escapeHtml(ivaLabel(plan.rate))}.</small>
        </label>
        <button class="danger-button" type="submit" ${plan.enabled && plan.candidatesCount && !plan.alreadyApplied ? "" : "disabled"}>
          ${svg("check")}Aplicar conversion
        </button>
      </form>
    </section>
  `;
}

function renderPrintingTabPanel() {
  const active = activePrintingTab();
  return `
    <section class="panel data-grid-wide config-tabs-panel">
      <div class="panel-body">
        <div class="chip-row compact-chip-row">
          ${printingTabs()
            .map(([id, label]) => `
              <button class="chip ${active === id ? "is-active" : ""}" data-printing-tab="${id}" type="button">
                ${escapeHtml(label)}
              </button>
            `)
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderPrinterTest() {
  if (!isAdminUser()) return "";
  if (activePrintingTab() === "commands") return renderCommandPrinterSettings();
  const printersCount = printerRuntime.printers.length;
  const savedTicketName = savedTicketPrinterName();
  const selectedTicketName = selectedTicketPrinterName();
  const selectedLabel = selectedTicketName || "Pendiente";
  const marginLeftMm = ticketMarginLeftMm();
  const marginRightMm = ticketMarginRightMm();
  const logoWidthMm = ticketLogoWidthMm();
  const logoLoadedLabel = ticketLogoDataUrl() ? "Personalizado" : "Logo base";
  const fakeReceiptType = printerRuntime.fakeReceiptType === "postpaid" ? "postpaid" : "prepaid";
  const fakeReceiptLabel = fakeReceiptType === "postpaid" ? "postpago" : "prepago";
  const removeTarget = renderedPrinterValue() || printerRuntime.manualName;
  const status = printerRuntime.error
    ? printerRuntime.error
    : printerRuntime.loading
      ? "Buscando impresoras"
      : printerRuntime.removing
        ? "Eliminando impresora"
      : `${printersCount} impresora${printersCount === 1 ? "" : "s"}`;
  return `
    <div class="data-layout printer-layout" data-printer-panel ${ticketMarginPreviewStyle()}>
      ${renderPrintingTabPanel()}
      <section class="summary-grid">
        ${renderSummaryCard("Impresoras", String(printersCount))}
        ${renderSummaryCard("Ticket", escapeHtml(selectedLabel))}
        ${renderSummaryCard("Margen", `Izq ${marginLeftMm} · Der ${marginRightMm} mm`)}
        ${renderSummaryCard("Logo", ticketLogoEnabled() ? `${logoWidthMm} mm ${ticketLogoPositionLabel()}` : "No incluido")}
        ${renderSummaryCard("Ultima prueba", printerRuntime.lastPrintedAt ? formatDateTime(printerRuntime.lastPrintedAt) : "Sin prueba")}
      </section>
      <section class="panel data-grid-wide printer-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Test de impresora</h2>
            <p class="panel-kicker">${escapeHtml(status)}</p>
          </div>
        </div>
        <div class="panel-body field-grid">
          <label class="field">
            <span>Impresora de tickets</span>
            <select data-printer-select ${printerRuntime.loading ? "disabled" : ""}>
              ${renderPrinterOptions()}
            </select>
          </label>
          <label class="field">
            <span>Nombre manual</span>
            <input data-printer-manual value="${escapeAttr(printerRuntime.manualName)}" placeholder="Nombre exacto para tickets" ${printerRuntime.loading ? "disabled" : ""} />
          </label>
          <label class="field">
            <span>Margen izquierdo</span>
            <input data-ticket-margin-mm data-ticket-margin-side="left" type="number" min="0" max="20" step="1" value="${marginLeftMm}" />
            <small>${marginLeftMm} mm desde el borde izquierdo.</small>
          </label>
          <label class="field">
            <span>Margen derecho</span>
            <input data-ticket-margin-mm data-ticket-margin-side="right" type="number" min="0" max="20" step="1" value="${marginRightMm}" />
            <small>${marginRightMm} mm desde el borde derecho. Sube este valor si se cortan los precios.</small>
          </label>
          <label class="field">
            <span>Logo de ticket</span>
            <input data-ticket-logo-file type="file" accept="image/png,image/jpeg" />
            <small>${escapeHtml(logoLoadedLabel)}. PNG o JPG, maximo 2 MB.</small>
          </label>
          <label class="field">
            <span>Tamano del logo</span>
            <input data-ticket-logo-width-mm type="number" min="10" max="48" step="1" value="${logoWidthMm}" />
            <small>${logoWidthMm} mm de ancho, centrado en el ticket.</small>
          </label>
          <label class="field printer-logo-toggle">
            <span>Incluir logo en ticket</span>
            <input data-ticket-logo-enabled type="checkbox" ${ticketLogoEnabled() ? "checked" : ""} />
            <small>Sustituye la linea LibrePOS y se coloca junto al titulo del ticket.</small>
          </label>
          <div class="field printer-logo-position-field">
            <span>Posicion del logo</span>
            <div class="printer-logo-position" role="radiogroup" aria-label="Posicion del logo">
              <label>
                <input data-ticket-logo-position name="ticket-logo-position" type="radio" value="above-title" ${ticketLogoPosition() === "above-title" ? "checked" : ""} />
                <span>Arriba del titulo</span>
              </label>
              <label>
                <input data-ticket-logo-position name="ticket-logo-position" type="radio" value="below-title" ${ticketLogoPosition() === "below-title" ? "checked" : ""} />
                <span>Abajo del titulo</span>
              </label>
            </div>
            <small>El titulo del ticket queda centrado en ambos modos.</small>
          </div>
          ${printerRuntime.error ? `<div class="checkout-warning">${svg("alert")}${escapeHtml(printerRuntime.error)}</div>` : ""}
          <div class="printer-action-row">
            <button class="secondary-button" data-select-printer type="button" ${printerRuntime.loading ? "disabled" : ""}>
              ${svg("print")}Seleccionar para tickets
            </button>
            <button class="secondary-button" data-clear-printer type="button" ${printerRuntime.loading || printerRuntime.removing || (!savedTicketName && !printerRuntime.manualName) ? "disabled" : ""}>
              ${svg("trash")}Quitar guardada
            </button>
            <button class="primary-button" data-print-test type="button" ${printerRuntime.printing || !selectedTicketName ? "disabled" : ""}>
              ${svg("print")}${printerRuntime.printing ? "Imprimiendo" : "Imprimir ticket de prueba"}
            </button>
            <button class="secondary-button" data-print-legacy type="button" ${printerRuntime.legacyPrinting || !selectedTicketName ? "disabled" : ""}>
              ${svg("print")}${printerRuntime.legacyPrinting ? "Imprimiendo" : "Impresion legacy"}
            </button>
            <button class="secondary-button" data-clear-ticket-logo type="button" ${!ticketLogoDataUrl() ? "disabled" : ""}>
              ${svg("trash")}Restaurar logo
            </button>
            <button class="danger-button" data-remove-system-printer type="button" ${printerRuntime.loading || printerRuntime.removing || !removeTarget ? "disabled" : ""}>
              ${svg("trash")}${printerRuntime.removing ? "Eliminando" : "Eliminar del sistema"}
            </button>
          </div>
        </div>
      </section>
      <section class="panel data-grid-wide printer-preview-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Previsualizacion 58mm</h2>
            <p class="panel-kicker">Cuenta falsa ${escapeHtml(fakeReceiptLabel)} a 32 columnas; se imprime en 58mm con fuente monoespaciada.</p>
          </div>
        </div>
        <div class="panel-body printer-preview-body">
          <div class="printer-preview-actions">
            <button class="secondary-button ${fakeReceiptType === "prepaid" ? "is-active" : ""}" data-generate-fake-receipt="prepaid" type="button" ${printerRuntime.fakeReceiptLoading ? "disabled" : ""}>
              ${svg("transfer")}${printerRuntime.fakeReceiptLoading && fakeReceiptType === "prepaid" ? "Generando" : "Ver prepago"}
            </button>
            <button class="secondary-button ${fakeReceiptType === "postpaid" ? "is-active" : ""}" data-generate-fake-receipt="postpaid" type="button" ${printerRuntime.fakeReceiptLoading ? "disabled" : ""}>
              ${svg("transfer")}${printerRuntime.fakeReceiptLoading && fakeReceiptType === "postpaid" ? "Generando" : "Ver postpago"}
            </button>
            <button class="primary-button" data-print-fake-receipt="prepaid" type="button" ${printerRuntime.fakeReceiptPrinting || !selectedTicketName ? "disabled" : ""}>
              ${svg("print")}${printerRuntime.fakeReceiptPrinting && fakeReceiptType === "prepaid" ? "Imprimiendo" : "Imprimir prueba prepago"}
            </button>
            <button class="primary-button" data-print-fake-receipt="postpaid" type="button" ${printerRuntime.fakeReceiptPrinting || !selectedTicketName ? "disabled" : ""}>
              ${svg("print")}${printerRuntime.fakeReceiptPrinting && fakeReceiptType === "postpaid" ? "Imprimiendo" : "Imprimir prueba postpago"}
            </button>
            <button class="secondary-button" data-print-receipt-header type="button" ${printerRuntime.headerPrinting || !selectedTicketName ? "disabled" : ""}>
              ${svg("print")}${printerRuntime.headerPrinting ? "Imprimiendo" : "Imprimir solo cabecera"}
            </button>
          </div>
          ${renderReceiptPreviewHtml(printerRuntime.fakeReceiptText)}
          <section class="printer-logo-preview">
            <div class="printer-logo-paper">
              <img data-ticket-logo-preview-img src="${escapeAttr(ticketLogoSrc())}" alt="Logo ticket" style="width: ${ticketLogoPreviewWidthPx()}px" />
            </div>
            <button class="secondary-button" data-print-logo type="button" ${printerRuntime.logoPrinting || !selectedTicketName ? "disabled" : ""}>
              ${svg("print")}${printerRuntime.logoPrinting ? "Imprimiendo" : "Imprimir logo"}
            </button>
          </section>
        </div>
      </section>
    </div>
  `;
}

function renderCommandPrinterSettings() {
  const printersCount = printerRuntime.printers.length;
  const savedCommandName = savedCommandPrinterName();
  const selectedCommandName = selectedCommandPrinterName();
  const selectedTicketName = selectedTicketPrinterName();
  const selectedLabel = selectedCommandName || "Pendiente";
  const autoEnabled = commandAutoPrintEnabled();
  const removeTarget = renderedCommandPrinterValue() || printerRuntime.manualCommandName;
  const fallbackLabel = savedCommandName ? "Dedicada" : (selectedTicketName ? "Usa tickets" : "Pendiente");
  const status = printerRuntime.error
    ? printerRuntime.error
    : printerRuntime.loading
      ? "Buscando impresoras"
      : `${printersCount} impresora${printersCount === 1 ? "" : "s"}`;
  const previewText = commandPreviewText();
  return `
    <div class="data-layout printer-layout" data-printer-panel ${ticketMarginPreviewStyle()}>
      ${renderPrintingTabPanel()}
      <section class="summary-grid">
        ${renderSummaryCard("Impresoras", String(printersCount))}
        ${renderSummaryCard("Comandas", autoEnabled ? "Automaticas" : "Desactivadas", autoEnabled ? "ok" : "")}
        ${renderSummaryCard("Impresora", escapeHtml(selectedLabel))}
        ${renderSummaryCard("Modo", escapeHtml(fallbackLabel))}
        ${renderSummaryCard("Ultima comanda", printerRuntime.commandLastPrintedAt ? formatDateTime(printerRuntime.commandLastPrintedAt) : "Sin prueba")}
      </section>
      <section class="panel data-grid-wide printer-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Comandas de cocina</h2>
            <p class="panel-kicker">${escapeHtml(status)}</p>
          </div>
        </div>
        <div class="panel-body field-grid">
          <label class="field printer-logo-toggle">
            <span>Impresion automatica</span>
            <input data-command-print-enabled type="checkbox" ${autoEnabled ? "checked" : ""} />
            <small>Cuando una mesa se comanda, se envia una comanda simple a cocina.</small>
          </label>
          <label class="field">
            <span>Impresora de comandas</span>
            <select data-command-printer-select ${printerRuntime.loading ? "disabled" : ""}>
              ${renderCommandPrinterOptions()}
            </select>
            <small>${savedCommandName ? `Guardada: ${escapeHtml(savedCommandName)}` : "Si no guardas una dedicada, usa la impresora de tickets."}</small>
          </label>
          <label class="field">
            <span>Nombre manual</span>
            <input data-command-printer-manual value="${escapeAttr(printerRuntime.manualCommandName)}" placeholder="Nombre exacto para comandas" ${printerRuntime.loading ? "disabled" : ""} />
          </label>
          ${printerRuntime.error ? `<div class="checkout-warning">${svg("alert")}${escapeHtml(printerRuntime.error)}</div>` : ""}
          <div class="printer-action-row">
            <button class="secondary-button" data-select-command-printer type="button" ${printerRuntime.loading ? "disabled" : ""}>
              ${svg("print")}Seleccionar para comandas
            </button>
            <button class="secondary-button" data-clear-command-printer type="button" ${printerRuntime.loading || (!savedCommandName && !printerRuntime.manualCommandName) ? "disabled" : ""}>
              ${svg("trash")}Quitar guardada
            </button>
            <button class="primary-button" data-print-command-preview type="button" ${printerRuntime.commandPrinting || !selectedCommandName ? "disabled" : ""}>
              ${svg("print")}${printerRuntime.commandPrinting ? "Imprimiendo" : "Imprimir prueba comanda"}
            </button>
            <button class="danger-button" data-remove-system-printer type="button" ${printerRuntime.loading || printerRuntime.removing || !removeTarget ? "disabled" : ""}>
              ${svg("trash")}${printerRuntime.removing ? "Eliminando" : "Eliminar del sistema"}
            </button>
          </div>
        </div>
      </section>
      <section class="panel data-grid-wide printer-preview-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Previsualizacion comanda</h2>
            <p class="panel-kicker">Formato simple para cocina, sin precios, propina ni IVA.</p>
          </div>
        </div>
        <div class="panel-body printer-preview-body">
          <div class="printer-preview-actions">
            <button class="secondary-button" data-refresh-command-preview type="button">
              ${svg("transfer")}Actualizar previsualizacion
            </button>
          </div>
          ${renderCommandReceiptPreviewHtml(previewText)}
        </div>
      </section>
    </div>
  `;
}

function printerErrorMessage(error) {
  const value = String(error || "");
  const normalized = normalize(value);
  if (normalized.includes("admin-required")) return "Solo admin puede usar el test de impresora.";
  if (normalized.includes("cash-required")) return "Solo usuarios de caja pueden imprimir tickets de cobro.";
  if (normalized.includes("printer-user-required")) return "Solo usuarios de mesa o caja pueden imprimir tickets.";
  if (normalized.includes("printer-required")) return "Selecciona una impresora.";
  if (normalized.includes("printer-not-found")) return "No existe una impresora con ese nombre exacto.";
  if (normalized.includes("printer-offline")) return "Windows marca esa impresora como offline.";
  if (normalized.includes("powershell-not-found")) return "No se encontro Windows PowerShell en este equipo.";
  if (normalized.includes("windows-receipt-print-failed")) return "Windows no pudo imprimir el ticket ni con el modo compatible. Revisa que la impresora no este pausada y prueba la impresion legacy.";
  if (normalized.includes("powershell-failed")) return `PowerShell devolvio error: ${value}`;
  if (normalized.includes("printer-legacy-print-failed")) return `No se pudo imprimir en modo legacy: ${value}`;
  if (normalized.includes("printer-fake-receipt-failed")) return `No se pudo imprimir la cuenta falsa: ${value}`;
  if (normalized.includes("printer-header-print-failed")) return `No se pudo imprimir la cabecera: ${value}`;
  if (normalized.includes("printer-logo-print-failed")) return `No se pudo imprimir el logo: ${value}`;
  if (normalized.includes("printer-command-failed")) return `No se pudo imprimir la comanda: ${value}`;
  if (normalized.includes("printer-command-fallback-error")) return `No se pudo imprimir la comanda con la ruta de compatibilidad: ${value}`;
  if (normalized.includes("printer-fetch-failed") || normalized.includes("failed to fetch") || normalized.includes("load failed")) return `No se pudo contactar la API local de impresion: ${value}`;
  if (normalized.includes("printer-receipt-failed")) return `No se pudo imprimir el ticket: ${value}`;
  if (normalized.includes("printer-sale-receipt-failed")) return `No se pudo imprimir el ticket de cobro: ${value}`;
  if (normalized.includes("access is denied") || normalized.includes("acceso denegado")) return "Windows denego el acceso a la impresora. Ejecuta LibrePOS como administrador o revisa permisos.";
  if (normalized.includes("windows-print-failed")) return `Windows no pudo imprimir: ${value}`;
  if (normalized.includes("printer-remove-failed")) return `No se pudo eliminar la impresora: ${value}`;
  if (normalized.includes("printer-print-failed")) return "No se pudo enviar el ticket a la impresora.";
  if (normalized.includes("not-found") || normalized.includes("enoent")) return "No se encontro el servicio de impresion del sistema.";
  if (normalized.includes("lp:") || normalized.includes("out-printer")) return "No se pudo enviar el ticket a la impresora.";
  return value || "No se pudo completar la accion de impresora.";
}

function receiptPrintMoney(value) {
  const number = roundCurrency(value);
  const formatted = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number);
  return `$${formatted}`;
}

function receiptPrintSanitize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function receiptPrintCenter(value, width = RECEIPT_PRINT_WIDTH) {
  const text = receiptPrintSanitize(value).slice(0, width);
  const left = Math.max(0, Math.floor((width - text.length) / 2));
  return `${" ".repeat(left)}${text}`;
}

function receiptPrintRule(char = "-") {
  return char.repeat(RECEIPT_PRINT_WIDTH);
}

function receiptPrintColumns(left, right, width = RECEIPT_PRINT_WIDTH) {
  const cleanRight = receiptPrintSanitize(right);
  const maxLeft = Math.max(1, width - cleanRight.length - 1);
  const cleanLeft = receiptPrintSanitize(left).slice(0, maxLeft);
  const spaces = Math.max(1, width - cleanLeft.length - cleanRight.length);
  return `${cleanLeft}${" ".repeat(spaces)}${cleanRight}`;
}

function receiptPrintWrap(value, indent = "  ", width = RECEIPT_PRINT_WIDTH) {
  const text = receiptPrintSanitize(value);
  if (!text) return [];
  const words = text.split(" ");
  const lines = [];
  let line = indent;
  const available = Math.max(1, width - indent.length);
  words.forEach((rawWord) => {
    let word = rawWord;
    while (word.length > available) {
      if (line.trim()) {
        lines.push(line);
        line = indent;
      }
      lines.push(`${indent}${word.slice(0, available)}`);
      word = word.slice(available);
    }
    const candidate = line.trim() ? `${line} ${word}` : `${indent}${word}`;
    if (candidate.length <= width) {
      line = candidate;
    } else {
      if (line.trim()) lines.push(line);
      line = `${indent}${word}`;
    }
  });
  if (line.trim()) lines.push(line);
  return lines;
}

function receiptPrintCenteredWrap(value) {
  return receiptPrintWrap(value, "").map((line) => receiptPrintCenter(line));
}

function saleReceiptLineNetTotal(item, ivaRate = 0) {
  return taxBreakdownForGross(saleLineTotal(item), ivaRate).netSubtotal;
}

function receiptPrintOptionsText(value) {
  return String(value || "").replace(/\s*\(\+\$[0-9.,]+\)/g, "");
}

function saleReceiptItemLines(item, ivaRate = 0) {
  const qty = formatPlainNumber(item.qty);
  const name = item.name || "Producto";
  const lines = [receiptPrintColumns(`${qty} ${name}`, receiptPrintMoney(saleReceiptLineNetTotal(item, ivaRate)))];
  if (item.optionsText) lines.push(...receiptPrintWrap(receiptPrintOptionsText(item.optionsText)));
  if (item.note) lines.push(...receiptPrintWrap(`Nota: ${item.note}`));
  return lines;
}

function commandReceiptPartLines(line) {
  const parts = lineParts(line);
  if (!parts) return [];
  return parts.flatMap((part, index) => {
    const label = part?.label || part?.name || `Parte ${index + 1}`;
    const productName = part?.productName || part?.product?.name || "";
    const text = productName ? `${label}: ${productName}` : label;
    return receiptPrintWrap(text);
  });
}

function commandReceiptLineLines(line) {
  const qty = formatPlainNumber(line.qty || 1);
  const name = line.name || "Producto";
  const lines = receiptPrintWrap(`${qty} ${name}`, "");
  lines.push(...commandReceiptPartLines(line));
  if (line.optionsText) lines.push(...receiptPrintWrap(receiptPrintOptionsText(line.optionsText)));
  if (line.note) lines.push(...receiptPrintWrap(`Nota: ${line.note}`));
  return lines;
}

function buildCommandReceiptText(order, batch) {
  const createdAt = batch?.createdAt || new Date().toISOString();
  const orderNumber = orderNumberLabel(order);
  const dailyNumber = orderDailyNumber(order, createdAt);
  const createdBy = batch?.createdBy || order?.waiterId || currentUser()?.id || "";
  const lines = [
    receiptPrintCenter("COMANDA"),
    receiptPrintRule("="),
    receiptPrintColumns("Orden dia", dailyNumber || "-"),
    receiptPrintColumns("Fecha", localDateKey(createdAt)),
    receiptPrintColumns("Hora", formatTime(createdAt)),
    receiptPrintColumns("Mesa/orden", orderLabel(order)),
    receiptPrintColumns("Folio", orderNumber || "-"),
    receiptPrintColumns("Mesero", waiterName(createdBy)),
    receiptPrintRule(),
    ...(Array.isArray(batch?.lines) ? batch.lines.flatMap(commandReceiptLineLines) : []),
    receiptPrintRule(),
    receiptPrintRule("="),
    receiptPrintRule("-"),
    "",
    "",
  ].filter((line) => line !== "");
  return lines.join("\n");
}

function buildSampleCommandReceiptText() {
  const sampleOrder = {
    type: "table",
    tableNumber: 4,
    orderNumber: "12",
    dailyOrderNumber: 3,
    openedAt: new Date().toISOString(),
    waiterId: currentUser()?.id || "",
  };
  const sampleBatch = {
    createdAt: new Date().toISOString(),
    createdBy: currentUser()?.id || "",
    lines: [
      { qty: 2, name: "Tacos de cecina", station: "Cocina", optionsText: "Salsa aparte", note: "Sin cebolla" },
      { qty: 1, name: "Quesadilla", station: "Cocina", optionsText: "Queso extra" },
      { qty: 1, name: "Agua fresca", station: "Barra", note: "Poco hielo" },
    ],
  };
  return buildCommandReceiptText(sampleOrder, sampleBatch);
}

function commandPreviewText() {
  return printerRuntime.commandPreviewText || buildSampleCommandReceiptText();
}

function refreshCommandPreview() {
  printerRuntime.commandPreviewText = buildSampleCommandReceiptText();
  render();
}

function saleReceiptTipLabel(sale) {
  const mode = sale.totals?.tipMode || sale.tip?.mode || "none";
  const value = Number(sale.totals?.tipValue ?? sale.tip?.value) || 0;
  if (mode === "percent" && value > 0) return `Propina ${formatPlainNumber(value)}%`;
  return "Propina";
}

function buildPrepaidReceiptText(order) {
  const printedAt = new Date().toISOString();
  const totals = calculateTotals(order);
  const orderNumber = ensureOrderNumber(order);
  const orderLabelText = order.type === "table" ? `Mesa ${order.tableNumber || ""}`.trim() : "Para llevar";
  const lines = [
    ...receiptBrandLines(),
    ...receiptPrintCenteredWrap(RESTAURANT_ADDRESS),
    receiptPrintCenter("TICKET PREPAGO"),
    receiptPrintRule(),
    receiptPrintColumns("Folio", orderNumber || "-"),
    formatCsvDateTime(printedAt),
    receiptPrintColumns(orderLabelText, `Mesero ${waiterName(order.waiterId)}`),
    receiptPrintRule(),
    ...(Array.isArray(order.items) ? order.items.flatMap((item) => saleReceiptItemLines(item, totals.ivaRate)) : []),
    receiptPrintRule(),
    receiptPrintColumns("Subtotal s/IVA", receiptPrintMoney(totals.netSubtotal)),
    receiptPrintColumns(ivaLabel(totals.ivaRate), receiptPrintMoney(totals.iva)),
    receiptPrintColumns("TOTAL", receiptPrintMoney(totals.total)),
    receiptPrintCenter("Pendiente de pago"),
    receiptPrintRule(),
    receiptPrintCenter("Gracias por su visita"),
    "",
    "",
  ].filter((line) => line !== "");
  return lines.join("\n");
}

function buildPostpaidReceiptText(sale) {
  const closedAt = saleClosedAt(sale) || new Date().toISOString();
  const uid = paymentUidForSale(sale);
  const payment = sale.payment || {};
  const cashDue = Number(payment.cashDue) || 0;
  const cardDue = Number(payment.cardDue) || 0;
  const cashReceived = Number(payment.cashReceived) || 0;
  const changeGiven = Number(payment.changeGiven) || 0;
  const tipAmount = saleTip(sale);
  const tax = saleTaxBreakdown(sale);
  const orderLabelText = sale.type === "table" ? `Mesa ${sale.tableNumber || ""}`.trim() : "Para llevar";
  const paymentLines = [];
  if (cardDue > 0) paymentLines.push(receiptPrintColumns("Pago tarjeta", receiptPrintMoney(cardDue)));
  if (cashDue > 0) {
    paymentLines.push(receiptPrintColumns("Pago efectivo", receiptPrintMoney(cashReceived || cashDue)));
    paymentLines.push(receiptPrintColumns("Cambio", receiptPrintMoney(changeGiven)));
  }
  if (!paymentLines.length) paymentLines.push(receiptPrintColumns(`Pago ${sale.paymentMethod || "Efectivo"}`, receiptPrintMoney(saleTotal(sale))));
  const lines = [
    ...receiptBrandLines(),
    ...receiptPrintCenteredWrap(RESTAURANT_ADDRESS),
    receiptPrintCenter("TICKET POSTPAGO"),
    receiptPrintRule(),
    receiptPrintColumns("Folio", sale.orderNumber || uid || "-"),
    formatCsvDateTime(closedAt),
    receiptPrintColumns(orderLabelText, `Mesero ${waiterName(sale.waiterId)}`),
    receiptPrintRule(),
    ...(Array.isArray(sale.items) ? sale.items.flatMap((item) => saleReceiptItemLines(item, tax.ivaRate)) : []),
    receiptPrintRule(),
    receiptPrintColumns("Subtotal s/IVA", receiptPrintMoney(tax.netSubtotal)),
    receiptPrintColumns(ivaLabel(tax.ivaRate), receiptPrintMoney(tax.iva)),
    receiptPrintColumns("Consumo", receiptPrintMoney(saleSubtotal(sale))),
    tipAmount ? receiptPrintColumns(saleReceiptTipLabel(sale), receiptPrintMoney(tipAmount)) : "",
    receiptPrintColumns("TOTAL", receiptPrintMoney(saleTotal(sale))),
    ...paymentLines,
    receiptPrintRule(),
    receiptPrintCenter("Gracias por su visita"),
    "",
    "",
  ].filter((line) => line !== "");
  return lines.join("\n");
}

async function postPrinterRequest(path, body, fallbackError) {
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const detail = `${path} ${error?.message || error || "fetch-error"}`;
    throw new Error(`printer-fetch-failed ${detail}`);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.detail || payload.error || fallbackError);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function sendReceiptPrintRequest(ticketText) {
  const printerName = selectedTicketPrinterName();
  if (!printerName) {
    throw new Error("printer-required");
  }
  return postPrinterRequest("/api/printers/order-receipt/print", {
    userId: currentUser()?.id || "",
    printerName,
    ...ticketMarginPayload(),
    ...ticketLogoPayload(),
    ticketText,
  }, "printer-receipt-error");
}

async function sendCommandPrintRequest(ticketText) {
  const printerName = selectedCommandPrinterName();
  if (!printerName) {
    throw new Error("printer-required");
  }
  const body = {
    userId: currentUser()?.id || "",
    printerName,
    ...ticketMarginPayload(),
    ticketText,
  };
  try {
    return await postPrinterRequest("/api/printers/command/print", body, "printer-command-error");
  } catch (error) {
    if (error.status !== 404 && !normalize(error.message).includes("printer-fetch-failed")) throw error;
    const payload = await postPrinterRequest("/api/printers/order-receipt/print", body, "printer-command-fallback-error");
    return { ...payload, method: payload.method ? `${payload.method}:command-fallback` : "command-fallback" };
  }
}

function markCommandBatchPrinted(batch, payload = {}) {
  if (!batch) return;
  batch.printedAt = payload.printedAt || new Date().toISOString();
  batch.printedBy = currentUser()?.id || batch.printedBy || "";
  batch.printMethod = payload.method || "";
  batch.printError = "";
  batch.printFailedAt = "";
}

function markCommandBatchFailed(batch, error) {
  if (!batch) return;
  batch.printError = printerErrorMessage(error?.message || error);
  batch.printFailedAt = new Date().toISOString();
}

function markPrepaidReceiptPrinted(order, payload = {}) {
  if (!order) return;
  order.prepaidReceiptPrintedAt = payload.printedAt || new Date().toISOString();
  order.prepaidReceiptPrintedBy = currentUser()?.id || order.prepaidReceiptPrintedBy || "";
  order.prepaidReceiptMethod = payload.method || "";
  order.prepaidReceiptError = "";
  order.prepaidReceiptFailedAt = "";
}

function markPrepaidReceiptFailed(order, error) {
  if (!order) return;
  order.prepaidReceiptError = printerErrorMessage(error?.message || error);
  order.prepaidReceiptFailedAt = new Date().toISOString();
}

async function printCommandBatch(orderId, batchId, { silent = false, force = false } = {}) {
  if (!force && !commandAutoPrintEnabled()) return false;
  const order = getOrder(orderId);
  const batch = order?.commandBatches?.find((item) => item.id === batchId);
  if (!order || !batch) {
    if (!silent) showToast("No se encontro la comanda para imprimir.");
    return false;
  }
  printerRuntime.commandPrinting = true;
  if (isPrintingConfigView()) render();
  try {
    const payload = await sendCommandPrintRequest(buildCommandReceiptText(order, batch));
    markCommandBatchPrinted(batch, payload);
    printerRuntime.commandLastPrintedAt = payload.printedAt || new Date().toISOString();
    persist();
    if (!silent) showToast("Comanda impresa.");
    return true;
  } catch (error) {
    markCommandBatchFailed(batch, error);
    persist();
    if (!silent) showToast(`Comanda enviada, pero no se imprimio: ${printerErrorMessage(error.message)}`);
    return false;
  } finally {
    printerRuntime.commandPrinting = false;
    if (currentUser() && (isPrintingConfigView() || state.view === "sale" || state.view === "kitchen")) render();
  }
}

async function printCommandPreview() {
  if (!isAdminUser()) {
    showToast("Solo admin puede imprimir pruebas.");
    return;
  }
  if (!selectedCommandPrinterName()) {
    showToast("Selecciona una impresora para comandas.");
    return;
  }
  printerRuntime.commandPrinting = true;
  printerRuntime.error = "";
  printerRuntime.commandPreviewText = commandPreviewText();
  render();
  try {
    const payload = await sendCommandPrintRequest(printerRuntime.commandPreviewText);
    printerRuntime.commandLastPrintedAt = payload.printedAt || new Date().toISOString();
    showToast("Prueba de comanda enviada.");
  } catch (error) {
    printerRuntime.error = printerErrorMessage(error.message);
    showToast(printerRuntime.error);
  } finally {
    printerRuntime.commandPrinting = false;
    if (isPrintingConfigView()) render();
  }
}

function markPostpaidReceiptPrinted(sale, payload = {}) {
  if (!sale) return;
  sale.postpaidReceiptPrintedAt = payload.printedAt || new Date().toISOString();
  sale.postpaidReceiptPrintedBy = currentUser()?.id || sale.postpaidReceiptPrintedBy || "";
  sale.postpaidReceiptMethod = payload.method || "";
  sale.postpaidReceiptError = "";
  sale.postpaidReceiptFailedAt = "";
  sale.postpaidReceiptWarningDismissedAt = "";
  sale.postpaidReceiptWarningDismissedBy = "";
}

function markPostpaidReceiptFailed(sale, error) {
  if (!sale) return;
  sale.postpaidReceiptPrintedAt = sale.postpaidReceiptPrintedAt || "";
  sale.postpaidReceiptError = printerErrorMessage(error?.message || error);
  sale.postpaidReceiptFailedAt = new Date().toISOString();
}

async function printPrepaidOrderReceipt(orderId) {
  const order = getOrder(orderId);
  if (!order) {
    showToast("Solo se puede imprimir prepago de una mesa abierta.");
    return false;
  }
  if (!order.items.length) {
    showToast("Agrega productos antes de imprimir el ticket.");
    return false;
  }
  try {
    const ticketText = buildPrepaidReceiptText(order);
    const payload = await sendReceiptPrintRequest(ticketText);
    markPrepaidReceiptPrinted(order, payload);
    persist();
    showToast("Ticket prepago enviado.");
    if (currentUser()) render();
    return true;
  } catch (error) {
    markPrepaidReceiptFailed(order, error);
    persist();
    if (currentUser()) render();
    showToast(`No se imprimio ticket prepago: ${printerErrorMessage(error.message)}`);
    return false;
  }
}

async function printPostpaidSaleReceipt(saleId, { silent = false } = {}) {
  const sale = state.sales.find((item) => item.id === saleId);
  if (!sale) {
    if (!silent) showToast("No se encontro la venta cerrada.");
    return false;
  }
  try {
    const payload = await sendReceiptPrintRequest(buildPostpaidReceiptText(sale));
    markPostpaidReceiptPrinted(sale, payload);
    persist();
    if (!silent) showToast("Ticket postpago enviado.");
    if (currentUser()) render();
    return true;
  } catch (error) {
    markPostpaidReceiptFailed(sale, error);
    persist();
    if (!silent) showToast(`No se imprimio ticket postpago: ${printerErrorMessage(error.message)}`);
    if (currentUser()) render();
    return false;
  }
}

async function printClosedSaleReceipt(sale) {
  const saleRecord = state.sales.find((item) => item.id === sale.id) || sale;
  if (!selectedTicketPrinterName()) {
    markPostpaidReceiptFailed(saleRecord, new Error("printer-required"));
    persist();
    showToast("Cuenta cobrada. Selecciona impresora para imprimir tickets.");
    if (currentUser() && state.view === "data") render();
    return;
  }
  try {
    const payload = await sendReceiptPrintRequest(buildPostpaidReceiptText(saleRecord));
    markPostpaidReceiptPrinted(saleRecord, payload);
    persist();
    showToast("Ticket postpago enviado.");
    if (currentUser() && state.view === "data") render();
  } catch (error) {
    markPostpaidReceiptFailed(saleRecord, error);
    persist();
    showToast(`Cuenta cobrada, pero no se imprimio ticket postpago: ${printerErrorMessage(error.message)}`);
    if (currentUser() && state.view === "data") render();
  }
}

function dismissPostpaidTicketWarning(saleId) {
  const sale = state.sales.find((item) => item.id === saleId);
  if (!sale) return;
  sale.postpaidReceiptWarningDismissedAt = new Date().toISOString();
  sale.postpaidReceiptWarningDismissedBy = currentUser()?.id || "";
  persist();
  render();
}

function dismissFilteredPostpaidTicketWarnings() {
  const warningSaleIds = filteredOrderSearchRecords({ limit: 0 })
    .filter((record) => record.saleId && record.postpaidPending)
    .map((record) => record.saleId);
  if (!warningSaleIds.length) {
    showToast("No hay postpagos pendientes para omitir con este filtro.");
    return;
  }
  const now = new Date().toISOString();
  warningSaleIds.forEach((saleId) => {
    const sale = state.sales.find((item) => item.id === saleId);
    if (!sale || postpaidReceiptPrinted(sale)) return;
    sale.postpaidReceiptWarningDismissedAt = now;
    sale.postpaidReceiptWarningDismissedBy = currentUser()?.id || "";
  });
  persist();
  render();
  showToast(`${warningSaleIds.length} postpago${warningSaleIds.length === 1 ? "" : "s"} omitido${warningSaleIds.length === 1 ? "" : "s"}.`);
}

async function printFilteredPendingPostpaidTickets() {
  if (postpaidTicketPrinting) return;
  const pendingSaleIds = filteredOrderSearchRecords({ limit: 0 })
    .filter((record) => record.saleId && record.postpaidPending)
    .map((record) => record.saleId);
  if (!pendingSaleIds.length) {
    showToast("No hay tickets postpago pendientes con este filtro.");
    return;
  }
  postpaidTicketPrinting = true;
  render();
  let printed = 0;
  for (const saleId of pendingSaleIds) {
    const ok = await printPostpaidSaleReceipt(saleId, { silent: true });
    if (ok) printed += 1;
  }
  postpaidTicketPrinting = false;
  persist();
  render();
  const failed = pendingSaleIds.length - printed;
  showToast(failed ? `Postpago: ${printed} impresos, ${failed} pendientes.` : `${printed} tickets postpago enviados.`);
}

async function loadPrinterList(force = false) {
  if (!isAdminUser()) return;
  if (printerRuntime.loading || (printerRuntime.loaded && !force)) return;
  printerRuntime = { ...printerRuntime, loading: true, error: "" };
  render();
  try {
    const userId = encodeURIComponent(currentUser()?.id || "");
    const response = await fetch(`/api/printers?userId=${userId}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "printer-list-error");
    printerRuntime.printers = Array.isArray(payload.printers) ? payload.printers : [];
    printerRuntime.error = payload.error ? printerErrorMessage(payload.error) : "";
    printerRuntime.loaded = true;
  } catch (error) {
    printerRuntime.printers = [];
    printerRuntime.error = printerErrorMessage(error.message);
    printerRuntime.loaded = true;
  } finally {
    printerRuntime.loading = false;
    if (isPrintingConfigView()) render();
  }
}

async function selectPrinterFromList() {
  if (!isAdminUser()) {
    showToast("Solo admin puede seleccionar impresora.");
    return;
  }
  if (!printerRuntime.loaded && !printerRuntime.loading) {
    await loadPrinterList(true);
  }
  const printerName = printerCandidateName();
  if (!printerName) {
    showToast("Selecciona una impresora o escribe el nombre manual.");
    return;
  }
  savePrinterName(printerName);
  printerRuntime.manualName = "";
  printerRuntime.error = "";
  showToast(`Impresora seleccionada: ${printerName}`);
  render();
}

function clearSavedPrinter() {
  savePrinterName("");
  printerRuntime.manualName = "";
  printerRuntime.error = "";
  showToast("Impresora quitada de LibrePOS.");
  render();
}

async function selectCommandPrinterFromList() {
  if (!isAdminUser()) {
    showToast("Solo admin puede seleccionar impresora.");
    return;
  }
  if (!printerRuntime.loaded && !printerRuntime.loading) {
    await loadPrinterList(true);
  }
  const printerName = commandPrinterCandidateName();
  if (!printerName) {
    showToast("Selecciona una impresora o escribe el nombre manual.");
    return;
  }
  saveCommandPrinterName(printerName);
  printerRuntime.manualCommandName = "";
  printerRuntime.error = "";
  showToast(`Impresora de comandas: ${printerName}`);
  render();
}

function clearSavedCommandPrinter() {
  saveCommandPrinterName("");
  printerRuntime.manualCommandName = "";
  printerRuntime.error = "";
  showToast("Impresora de comandas quitada. Se usara la de tickets.");
  render();
}

async function sendPrinterTest() {
  if (!isAdminUser()) {
    showToast("Solo admin puede imprimir pruebas.");
    return;
  }
  const printerName = selectedTicketPrinterName();
  if (!printerName) {
    showToast("Selecciona una impresora.");
    return;
  }
  printerRuntime.printing = true;
  printerRuntime.error = "";
  render();
  try {
    const payload = await postPrinterRequest("/api/printers/test", {
      userId: currentUser()?.id || "",
      printerName,
    }, "printer-test-error");
    printerRuntime.lastPrintedAt = payload.printedAt || new Date().toISOString();
    showToast(payload.method ? `Ticket enviado por ${payload.method}.` : "Ticket de prueba enviado.");
  } catch (error) {
    printerRuntime.error = printerErrorMessage(error.message);
    showToast(printerRuntime.error);
  } finally {
    printerRuntime.printing = false;
    if (isPrintingConfigView()) render();
  }
}

async function sendPrinterLegacyTest() {
  if (!isAdminUser()) {
    showToast("Solo admin puede imprimir pruebas.");
    return;
  }
  const printerName = selectedTicketPrinterName();
  if (!printerName) {
    showToast("Selecciona una impresora.");
    return;
  }
  printerRuntime.legacyPrinting = true;
  printerRuntime.error = "";
  render();
  try {
    const payload = await postPrinterRequest("/api/printers/test-legacy", {
      userId: currentUser()?.id || "",
      printerName,
    }, "printer-legacy-test-error");
    printerRuntime.lastPrintedAt = payload.printedAt || new Date().toISOString();
    showToast("Impresion legacy enviada.");
  } catch (error) {
    printerRuntime.error = printerErrorMessage(error.message);
    showToast(printerRuntime.error);
  } finally {
    printerRuntime.legacyPrinting = false;
    if (isPrintingConfigView()) render();
  }
}

function normalizeFakeReceiptType(value) {
  return value === "postpaid" ? "postpaid" : "prepaid";
}

async function loadFakeReceiptPreview(force = false, type = printerRuntime.fakeReceiptType) {
  if (!isAdminUser()) return;
  const receiptType = normalizeFakeReceiptType(type);
  if (printerRuntime.fakeReceiptLoading || (printerRuntime.fakeReceiptText && printerRuntime.fakeReceiptType === receiptType && !force)) return;
  printerRuntime.fakeReceiptLoading = true;
  printerRuntime.fakeReceiptType = receiptType;
  printerRuntime.error = "";
  render();
  try {
    const userId = encodeURIComponent(currentUser()?.id || "");
    const response = await fetch(`/api/printers/fake-receipt?userId=${userId}&type=${receiptType}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || payload.error || "printer-fake-receipt-preview-error");
    printerRuntime.fakeReceiptText = String(payload.ticketText || "");
    printerRuntime.fakeReceiptType = normalizeFakeReceiptType(payload.type || receiptType);
  } catch (error) {
    printerRuntime.error = printerErrorMessage(error.message);
    showToast(printerRuntime.error);
  } finally {
    printerRuntime.fakeReceiptLoading = false;
    if (isPrintingConfigView()) render();
  }
}

async function printFakeReceiptPreview(type = printerRuntime.fakeReceiptType) {
  if (!isAdminUser()) {
    showToast("Solo admin puede imprimir pruebas.");
    return;
  }
  const printerName = selectedTicketPrinterName();
  if (!printerName) {
    showToast("Selecciona una impresora.");
    return;
  }
  const receiptType = normalizeFakeReceiptType(type);
  if (!printerRuntime.fakeReceiptText || printerRuntime.fakeReceiptType !== receiptType) {
    await loadFakeReceiptPreview(true, receiptType);
  }
  if (!printerRuntime.fakeReceiptText) return;
  printerRuntime.fakeReceiptPrinting = true;
  printerRuntime.fakeReceiptType = receiptType;
  printerRuntime.error = "";
  render();
  try {
    const payload = await postPrinterRequest("/api/printers/fake-receipt/print", {
      userId: currentUser()?.id || "",
      printerName,
      ...ticketMarginPayload(),
      ...ticketLogoPayload(),
      type: receiptType,
      ticketText: receiptTextWithLogoMarker(printerRuntime.fakeReceiptText),
    }, "printer-fake-receipt-error");
    printerRuntime.lastPrintedAt = payload.printedAt || new Date().toISOString();
    if (payload.ticketText && !printerRuntime.fakeReceiptText) printerRuntime.fakeReceiptText = String(payload.ticketText);
    showToast(`Prueba ${receiptType === "postpaid" ? "postpago" : "prepago"} enviada.`);
  } catch (error) {
    printerRuntime.error = printerErrorMessage(error.message);
    showToast(printerRuntime.error);
  } finally {
    printerRuntime.fakeReceiptPrinting = false;
    if (isPrintingConfigView()) render();
  }
}

async function printReceiptHeader() {
  if (!isAdminUser()) {
    showToast("Solo admin puede imprimir pruebas.");
    return;
  }
  const printerName = selectedTicketPrinterName();
  if (!printerName) {
    showToast("Selecciona una impresora.");
    return;
  }
  printerRuntime.headerPrinting = true;
  printerRuntime.error = "";
  render();
  try {
    const payload = await postPrinterRequest("/api/printers/receipt-header/print", {
      userId: currentUser()?.id || "",
      printerName,
      ...ticketMarginPayload(),
      includeLogo: ticketLogoEnabled(),
      ...ticketLogoPayload(),
    }, "printer-header-print-error");
    printerRuntime.lastPrintedAt = payload.printedAt || new Date().toISOString();
    showToast("Cabecera enviada.");
  } catch (error) {
    printerRuntime.error = printerErrorMessage(error.message);
    showToast(printerRuntime.error);
  } finally {
    printerRuntime.headerPrinting = false;
    if (isPrintingConfigView()) render();
  }
}

async function printLogoTest() {
  if (!isAdminUser()) {
    showToast("Solo admin puede imprimir pruebas.");
    return;
  }
  const printerName = selectedTicketPrinterName();
  if (!printerName) {
    showToast("Selecciona una impresora.");
    return;
  }
  printerRuntime.logoPrinting = true;
  printerRuntime.error = "";
  render();
  try {
    const payload = await postPrinterRequest("/api/printers/logo/print", {
      userId: currentUser()?.id || "",
      printerName,
      ...ticketMarginPayload(),
      ...logoOnlyPayload(),
    }, "printer-logo-print-error");
    printerRuntime.lastPrintedAt = payload.printedAt || new Date().toISOString();
    showToast("Logo enviado.");
  } catch (error) {
    printerRuntime.error = printerErrorMessage(error.message);
    showToast(printerRuntime.error);
  } finally {
    printerRuntime.logoPrinting = false;
    if (isPrintingConfigView()) render();
  }
}

async function removeSelectedSystemPrinter() {
  if (!isAdminUser()) {
    showToast("Solo admin puede eliminar impresoras.");
    return;
  }
  const printerName = activePrintingTab() === "commands"
    ? (commandPrinterCandidateName() || selectedCommandPrinterName())
    : (printerCandidateName() || selectedTicketPrinterName());
  if (!printerName) {
    showToast("Selecciona una impresora.");
    return;
  }
  if (!window.confirm(`Eliminar impresora "${printerName}" de este equipo?`)) return;
  printerRuntime.removing = true;
  printerRuntime.error = "";
  render();
  try {
    const response = await fetch("/api/printers/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser()?.id || "", printerName }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || payload.error || "printer-remove-error");
    if (selectedTicketPrinterName() === printerName) savePrinterName("");
    if (savedCommandPrinterName() === printerName) saveCommandPrinterName("");
    printerRuntime.manualName = "";
    printerRuntime.manualCommandName = "";
    printerRuntime.loaded = false;
    printerRuntime.printers = [];
    showToast(`Impresora eliminada: ${printerName}`);
    await loadPrinterList(true);
  } catch (error) {
    printerRuntime.error = printerErrorMessage(error.message);
    showToast(printerRuntime.error);
  } finally {
    printerRuntime.removing = false;
    if (isPrintingConfigView()) render();
  }
}

function localDateValue(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function orderItemsSummary(items = []) {
  const cleanItems = Array.isArray(items) ? items : [];
  if (!cleanItems.length) return "Sin productos";
  const labels = cleanItems.slice(0, 4).map((item) => `${item.qty || 0} x ${item.name || "Producto"}`);
  const remaining = cleanItems.length - labels.length;
  return `${labels.join(" · ")}${remaining > 0 ? ` · +${remaining}` : ""}`;
}

function firstFilledValue(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function prepaidReceiptMeta(source = {}, fallback = {}) {
  const printedAt = firstFilledValue(source.prepaidReceiptPrintedAt, fallback.prepaidReceiptPrintedAt);
  return {
    prepaidPrinted: Boolean(printedAt),
    prepaidPrintedAt: printedAt,
    prepaidError: firstFilledValue(source.prepaidReceiptError, fallback.prepaidReceiptError),
    prepaidFailedAt: firstFilledValue(source.prepaidReceiptFailedAt, fallback.prepaidReceiptFailedAt),
  };
}

function prepaidReceiptPending(record) {
  return record.statusKey === "open" && record.hasItems && !record.prepaidPrinted;
}

function postpaidReceiptPrinted(sale) {
  return Boolean(sale?.postpaidReceiptPrintedAt);
}

function postpaidReceiptDismissed(sale) {
  return Boolean(sale?.postpaidReceiptWarningDismissedAt);
}

function postpaidReceiptPending(sale) {
  return !postpaidReceiptPrinted(sale) && !postpaidReceiptDismissed(sale);
}

function postpaidReceiptWarningVisible(sale) {
  return postpaidReceiptPending(sale);
}

function orderSearchRecords() {
  const orders = Array.isArray(state.orders) ? state.orders : [];
  const sales = Array.isArray(state.sales) ? state.sales : [];
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const saleOrderIds = new Set(sales.map((sale) => sale.orderId).filter(Boolean));
  const orderRecords = orders
    .filter((order) => order.status !== "closed" || !saleOrderIds.has(order.id))
    .map((order) => {
      const totals = calculateTotals(order);
      const isCancelled = order.status === "cancelled";
      const isClosed = order.status === "closed";
      const payment = order.payment || {};
      const total = isClosed ? roundCurrency(payment.total ?? payment.subtotal ?? totals.total) : totals.total;
      const iva = isClosed ? roundCurrency(payment.iva ?? payment.taxAmount ?? totals.iva) : totals.iva;
      return {
        recordType: isCancelled ? "Cancelada" : isClosed ? "Cerrada" : "Abierta",
        statusKey: isCancelled ? "cancelled" : isClosed ? "closed" : "open",
        id: orderNumberLabel(order, ""),
        uid: isCancelled ? "" : isClosed ? firstFilledValue(order.paymentUid, payment.uid) : "Pendiente cobro",
        saleId: "",
        orderId: order.id,
        hasItems: Boolean(order.items?.length),
        ...prepaidReceiptMeta(order),
        postpaidPrinted: false,
        postpaidPending: false,
        postpaidWarningVisible: false,
        date: order.cancelledAt || order.closedAt || order.openedAt || order.createdAt || new Date().toISOString(),
        label: orderLabel(order),
        waiter: waiterName(order.waiterId),
        payment: isCancelled ? "Sin cobro" : isClosed ? (order.paymentMethod || payment.method || "Sin cobro") : "Pendiente",
        total,
        iva,
        products: orderItemsSummary(order.items),
      };
    });
  const paidRecords = sales.map((sale) => {
    const sourceOrder = orderById.get(sale.orderId);
    return {
      recordType: "Cobrada",
      statusKey: "paid",
      id: orderNumberLabel(sale, ""),
      uid: paymentUidForSale(sale),
      saleId: sale.id,
      orderId: sale.orderId || "",
      hasItems: Boolean(sale.items?.length),
      ...prepaidReceiptMeta(sale, sourceOrder),
      postpaidPrinted: postpaidReceiptPrinted(sale),
      postpaidPrintedAt: sale.postpaidReceiptPrintedAt || "",
      postpaidPending: postpaidReceiptPending(sale),
      postpaidWarningVisible: postpaidReceiptWarningVisible(sale),
      postpaidError: sale.postpaidReceiptError || "",
      postpaidWarningDismissed: postpaidReceiptDismissed(sale),
      date: saleClosedAt(sale) || sale.createdAt || new Date().toISOString(),
      label: sale.label || sale.orderId || "Venta",
      waiter: waiterName(sale.waiterId),
      payment: sale.paymentMethod || "Efectivo",
      total: saleTotal(sale),
      iva: saleIvaAmount(sale),
      products: orderItemsSummary(sale.items),
    };
  });
  return [...paidRecords, ...orderRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function orderRecordMatchesStatus(record, status) {
  if (!status || status === "all") return true;
  if (status === "prepaid-pending") return prepaidReceiptPending(record);
  if (status === "prepaid-printed") return record.prepaidPrinted;
  if (status === "postpaid-pending") return record.statusKey === "paid" && record.postpaidPending;
  if (status === "postpaid-printed") return record.statusKey === "paid" && record.postpaidPrinted;
  return record.statusKey === status;
}

function filteredOrderSearchRecords({ limit = 100 } = {}) {
  const query = normalize(state.dataOrderSearch);
  const from = state.dataOrderFrom || "";
  const to = state.dataOrderTo || "";
  const status = state.dataOrderStatus || "all";
  const records = orderSearchRecords()
    .filter((record) => {
      if (!orderRecordMatchesStatus(record, status)) return false;
      const dateKey = localDateValue(record.date);
      if (from && dateKey < from) return false;
      if (to && dateKey > to) return false;
      if (!query) return true;
      const haystack = normalize(`${record.id} ${record.uid} ${record.label} ${record.waiter} ${record.payment} ${record.products}`);
      return haystack.includes(query);
    });
  return limit ? records.slice(0, limit) : records;
}

function orderStatusFilters() {
  return [
    { id: "all", label: "Todos" },
    { id: "open", label: "Abiertas" },
    { id: "paid", label: "Cobradas" },
    { id: "prepaid-pending", label: "Prepago pendiente" },
    { id: "prepaid-printed", label: "Prepago impreso" },
    { id: "postpaid-pending", label: "Postpago pendiente" },
    { id: "postpaid-printed", label: "Postpago impreso" },
    { id: "closed", label: "Cerradas sin venta" },
    { id: "cancelled", label: "Canceladas" },
  ];
}

function renderPrepaidTicketCell(record) {
  if (!record.hasItems) return "-";
  if (record.prepaidPrinted) {
    return `
      <div class="receipt-ticket-cell is-printed">
        <span class="shift-status is-active">Impreso</span>
        <small>${record.prepaidPrintedAt ? formatDateTime(record.prepaidPrintedAt) : ""}</small>
        ${
          record.statusKey === "open" && record.orderId
            ? `<button class="secondary-button compact" data-print-prepaid-order="${escapeAttr(record.orderId)}" type="button">${svg("print")}Reimprimir</button>`
            : ""
        }
      </div>
    `;
  }
  if (record.prepaidError) {
    return `
      <div class="receipt-ticket-cell is-pending">
        <div class="receipt-ticket-warning">
          ${svg("alert")}<span>No impreso</span>
        </div>
        <small>${escapeHtml(record.prepaidError)}</small>
        ${
          record.statusKey === "open" && record.orderId
            ? `<button class="secondary-button compact" data-print-prepaid-order="${escapeAttr(record.orderId)}" type="button">${svg("print")}Reintentar prepago</button>`
            : ""
        }
      </div>
    `;
  }
  if (record.statusKey === "open" && record.orderId) {
    return `
      <div class="receipt-ticket-cell is-pending">
        <span class="shift-status">Pendiente</span>
        <button class="secondary-button compact" data-print-prepaid-order="${escapeAttr(record.orderId)}" type="button">${svg("print")}Imprimir prepago</button>
      </div>
    `;
  }
  return `<span class="shift-status">No impreso</span>`;
}

function renderPostpaidTicketCell(record) {
  if (!record.saleId) return "-";
  if (record.postpaidPrinted) {
    return `
      <div class="postpaid-ticket-cell is-printed">
        <span class="shift-status is-active">Impreso</span>
        <small>${record.postpaidPrintedAt ? formatDateTime(record.postpaidPrintedAt) : ""}</small>
        <button class="secondary-button compact" data-print-postpaid-sale="${escapeAttr(record.saleId)}" type="button" ${postpaidTicketPrinting ? "disabled" : ""}>${svg("print")}Reimprimir</button>
      </div>
    `;
  }
  return `
    <div class="postpaid-ticket-cell is-pending">
      ${
        record.postpaidWarningVisible
          ? `
            <div class="postpaid-ticket-warning">
              ${svg("alert")}<span>Ticket postpago no imprimido</span>
              <button class="icon-button compact" data-dismiss-postpaid-warning="${escapeAttr(record.saleId)}" title="Quitar aviso">${svg("check")}</button>
            </div>
          `
          : `<span class="shift-status">Omitido</span>`
      }
      ${record.postpaidError ? `<small>${escapeHtml(record.postpaidError)}</small>` : ""}
      <button class="secondary-button compact" data-print-postpaid-sale="${escapeAttr(record.saleId)}" type="button" ${postpaidTicketPrinting ? "disabled" : ""}>${svg("print")}Imprimir postpago</button>
    </div>
  `;
}

function renderOrderSearchData() {
  const rows = filteredOrderSearchRecords();
  const actionRows = filteredOrderSearchRecords({ limit: 0 });
  const allRows = orderSearchRecords();
  const pendingPostpaidRows = actionRows.filter((record) => record.saleId && record.postpaidPending);
  const warningPostpaidRows = actionRows.filter((record) => record.saleId && record.postpaidPending);
  return `
    <section class="panel data-grid-wide order-search-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Buscador de ordenes</h2>
          <p class="panel-kicker">Busca por ID, UID, mesa, pago, producto o rango de fechas</p>
        </div>
        <div class="header-actions">
          <button class="secondary-button" data-dismiss-filtered-postpaid-warnings type="button" ${postpaidTicketPrinting || !warningPostpaidRows.length ? "disabled" : ""}>
            ${svg("check")}Omitir postpagos (${warningPostpaidRows.length})
          </button>
          <button class="secondary-button" data-print-pending-postpaid type="button" ${postpaidTicketPrinting || !pendingPostpaidRows.length ? "disabled" : ""}>
            ${svg("print")}${postpaidTicketPrinting ? "Imprimiendo" : `Imprimir pendientes (${pendingPostpaidRows.length})`}
          </button>
        </div>
      </div>
      <div class="panel-body field-grid">
        <div class="order-search-grid">
          <label class="field">
            <span>Buscar</span>
            <input data-order-search value="${escapeAttr(state.dataOrderSearch)}" placeholder="ID, UID, mesa, producto..." />
          </label>
          <label class="field">
            <span>Desde</span>
            <input data-order-from type="date" value="${escapeAttr(state.dataOrderFrom)}" />
          </label>
          <label class="field">
            <span>Hasta</span>
            <input data-order-to type="date" value="${escapeAttr(state.dataOrderTo)}" />
          </label>
          <button class="secondary-button" data-order-search-clear type="button">${svg("trash")}Limpiar</button>
        </div>
        <div class="chip-row compact-chip-row">
          ${orderStatusFilters()
            .map((filter) => {
              const count = filter.id === "all" ? allRows.length : allRows.filter((record) => orderRecordMatchesStatus(record, filter.id)).length;
              return `
                <button class="chip ${state.dataOrderStatus === filter.id || (!state.dataOrderStatus && filter.id === "all") ? "is-active" : ""}" data-order-status="${filter.id}" type="button">
                  ${escapeHtml(filter.label)}
                  <small>${count}</small>
                </button>
              `;
            })
            .join("")}
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>ID</th><th>UID</th><th>Fecha</th><th>Orden</th><th>Estado</th><th>Pago</th><th>Total</th><th>Prepago</th><th>Postpago</th><th>Productos</th><th>Detalle</th></tr></thead>
            <tbody>
              ${
                rows.length
                  ? rows
                      .map(
                        (record) => `
                          <tr>
                            <td><strong>${escapeHtml(record.id || "-")}</strong></td>
                            <td>${record.uid ? `<strong>${escapeHtml(record.uid)}</strong>` : "-"}</td>
                            <td>${formatDateTime(record.date)}</td>
                            <td><strong>${escapeHtml(record.label)}</strong><small>${escapeHtml(record.waiter)}</small></td>
                            <td><span class="shift-status ${record.recordType === "Cobrada" ? "is-active" : ""}">${escapeHtml(record.recordType)}</span></td>
                            <td>${escapeHtml(record.payment)}</td>
                            <td><strong>${money.format(record.total)}</strong><small>IVA ${money.format(record.iva || 0)}</small></td>
                            <td>${renderPrepaidTicketCell(record)}</td>
                            <td>${renderPostpaidTicketCell(record)}</td>
                            <td>${escapeHtml(record.products)}</td>
                            <td>
                              ${
                                record.saleId
                                  ? `<button class="secondary-button compact" data-open-modal="sale-detail" data-sale-id="${escapeAttr(record.saleId)}" type="button">${svg("note")}Ver cuenta</button>`
                                  : "-"
                              }
                            </td>
                          </tr>
                        `,
                      )
                      .join("")
                  : `<tr><td colspan="11">No hay ordenes con esos filtros.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderData() {
  const metrics = buildBusinessMetrics(new Date());
  const cancelTone = metrics.cancelCount === 0 ? "" : metrics.cancelCount <= 2 ? "warn" : "danger";
  return `
    <div class="data-layout">
      <section class="summary-grid">
        ${renderRevenueBreakdownCard(metrics)}
        ${renderSummaryCard("IVA hoy", money.format(metrics.iva))}
        ${renderSummaryCard("Propinas hoy", money.format(metrics.tips))}
        ${renderSummaryCard("Costo estimado", money.format(metrics.foodCost))}
        ${renderSummaryCard("Ganancia bruta", money.format(metrics.grossProfit), "ok")}
        ${renderSummaryCard("Gastos", money.format(metrics.expenses))}
        ${renderSummaryCard("Cancelaciones", `${metrics.cancelCount} · ${money.format(metrics.cancelAmount)}`, cancelTone)}
      </section>
      ${
        isAdminUser()
          ? `
            <section class="panel admin-tools">
              <div class="panel-header">
                <div>
                  <h2 class="panel-title">Reinicio de datos</h2>
                  <p class="panel-kicker">Acciones administrativas para empezar de cero por seccion</p>
                </div>
              </div>
              <div class="panel-body reset-grid">
                <button class="danger-button" data-reset-action="expenses-zero">${svg("cash")}Gastos a cero</button>
                <button class="danger-button" data-reset-action="sales-data">${svg("data")}Ventas y cancelaciones</button>
                <button class="danger-button" data-reset-action="operations">${svg("trash")}Operacion completa</button>
              </div>
            </section>
          `
          : ""
      }
      ${renderOrderSearchData()}
      ${renderDataExports()}
      ${renderExpenseControls()}
      ${renderCashClosuresData()}
      <div class="data-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Margen</h2>
              <p class="panel-kicker">Calculado con COSTEO RECETAS.xlsx</p>
            </div>
          </div>
          <div class="panel-body metric-stack">
            <div class="big-metric">
              <span>Margen bruto</span>
              <strong>${formatNumber(metrics.margin)}%</strong>
            </div>
            <div class="total-line"><span>Tickets cobrados</span><strong>${metrics.tickets}</strong></div>
            <div class="total-line"><span>Promedio por ticket</span><strong>${money.format(metrics.averageTicket)}</strong></div>
            <div class="total-line"><span>Utilidad despues de gastos</span><strong>${money.format(metrics.netAfterExpenses)}</strong></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Productos vendidos</h2>
              <p class="panel-kicker">Unidades, venta sin IVA y costo estimado</p>
            </div>
          </div>
          <div class="panel-body table-wrap">
            <table class="data-table">
              <thead><tr><th>Producto</th><th>Unidades</th><th>Venta s/IVA</th><th>Costo</th><th>Ganancia</th></tr></thead>
              <tbody>
                ${
                  metrics.products.length
                    ? metrics.products
                        .map(
                          (item) => `
                            <tr>
                              <td><strong>${escapeHtml(item.name)}</strong></td>
                              <td>${item.qty}</td>
                              <td>${money.format(item.revenue)}</td>
                              <td>${money.format(item.cost)}</td>
                              <td><strong>${money.format(item.revenue - item.cost)}</strong></td>
                            </tr>
                          `,
                        )
                        .join("")
                    : `<tr><td colspan="5">Aun no hay ventas cerradas.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </section>
        <section class="panel data-grid-wide">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Cancelaciones</h2>
              <p class="panel-kicker">Incidencias de productos y mesas sin cobro</p>
            </div>
          </div>
          <div class="panel-body table-wrap">
            <table class="data-table">
              <thead><tr><th>Fecha</th><th>Orden</th><th>Tipo</th><th>Producto</th><th>Cant.</th><th>Monto</th><th>Nota</th></tr></thead>
              <tbody>
                ${
                  metrics.cancellations.length
                    ? metrics.cancellations
                        .map(
                          (item) => `
                            <tr class="is-cancelled">
                              <td>${formatDateTime(item.createdAt)}</td>
                              <td><strong>${escapeHtml(item.orderLabel || "Orden")}</strong><small>${escapeHtml(waiterName(item.waiterId))}</small></td>
                              <td>${escapeHtml(cancellationStageLabel(item.stage))}<small>${escapeHtml(item.source || "Sistema")}</small></td>
                              <td>${escapeHtml(item.itemName || (item.scope === "order" ? "Orden completa" : "Producto"))}</td>
                              <td>${item.qty || ""}</td>
                              <td><strong>${money.format(item.amount || 0)}</strong></td>
                              <td>${escapeHtml(item.note || "Sin nota")}</td>
                            </tr>
                          `,
                        )
                        .join("")
                    : `<tr><td colspan="7">Aun no hay cancelaciones registradas.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderSummaryCard(label, value, tone = "") {
  return `
    <article class="summary-card${tone ? ` tone-${tone}` : ""}">
      <p class="summary-label">${label}</p>
      <p class="summary-value">${value}</p>
    </article>
  `;
}

function renderRevenueBreakdownCard(metrics) {
  const cash = Number(metrics.cashRevenue) || 0;
  const card = Number(metrics.cardRevenue) || 0;
  const total = Number(metrics.collected ?? metrics.revenue) || cash + card;
  return `
    <article class="summary-card summary-card-breakdown">
      <p class="summary-label">Cobrado hoy</p>
      <p class="summary-value">${money.format(total)}</p>
      <div class="summary-breakdown">
        <span><strong>${money.format(cash)}</strong>Efectivo</span>
        <span><strong>${money.format(card)}</strong>Tarjeta</span>
        <span><strong>${money.format(metrics.revenue || 0)}</strong>Venta s/IVA</span>
      </div>
    </article>
  `;
}

function renderFunctionChoices(selected = ["mesero"]) {
  return `
    <fieldset class="function-picker">
      <legend>Funciones</legend>
      ${userFunctionOptions
        .map(
          (option) => `
            <label class="function-option">
              <input type="checkbox" name="functions" value="${option.id}" ${selected.includes(option.id) ? "checked" : ""} />
              <span>${escapeHtml(option.label)}</span>
            </label>
          `,
        )
        .join("")}
    </fieldset>
  `;
}

function renderUserFunctionTags(user) {
  return `
    <div class="function-tags">
      ${normalizeUserFunctions(user)
        .map((item) => `<span class="function-tag fn-${escapeAttr(item)}">${escapeHtml(functionLabel(item))}</span>`)
        .join("")}
    </div>
  `;
}

function currentShift(userId) {
  return (state.attendance || []).find((shift) => shift.userId === userId && !shift.clockOutAt) || null;
}

// Si un fichaje lleva más de 24h abierto el usuario probablemente olvidó marcar salida.
// Lo cerramos automáticamente con la marca de auto-cierre para que las métricas no se rompan.
function autoCloseStaleShifts() {
  if (!Array.isArray(state.attendance) || !state.attendance.length) return false;
  const MAX_HOURS = 24;
  const cutoff = Date.now() - MAX_HOURS * 60 * 60 * 1000;
  let changed = false;
  state.attendance.forEach((shift) => {
    if (shift.clockOutAt) return;
    const start = new Date(shift.clockInAt).getTime();
    if (!Number.isFinite(start)) return;
    if (start <= cutoff) {
      shift.clockOutAt = new Date(start + MAX_HOURS * 60 * 60 * 1000).toISOString();
      shift.clockOutBy = "auto";
      shift.autoClosed = true;
      changed = true;
    }
  });
  return changed;
}

function shiftMinutes(shift) {
  return minutesBetween(shift.clockInAt, shift.clockOutAt || new Date());
}

function attendanceTodayMinutes(userId) {
  const today = new Date().toDateString();
  return (state.attendance || [])
    .filter((shift) => shift.userId === userId && new Date(shift.clockInAt).toDateString() === today)
    .reduce((sum, shift) => sum + shiftMinutes(shift), 0);
}

function formatDuration(minutes) {
  const safe = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (!hours) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function recordDate(value) {
  return value ? new Date(value) : null;
}

function isSameLocalDay(value, day = new Date()) {
  const date = recordDate(value);
  if (!date || Number.isNaN(date.getTime())) return false;
  return date.toDateString() === day.toDateString();
}

function saleClosedAt(sale) {
  return sale.chargedAt || sale.closedAt || sale.createdAt;
}

function saleTotal(sale) {
  return Number(sale.totals?.total ?? sale.total ?? 0);
}

function saleLineTotal(item) {
  return roundCurrency(Number(item?.total ?? item?.amount ?? (Number(item?.unitPrice) || 0) * (Number(item?.qty) || 0)) || 0);
}

function saleSubtotal(sale) {
  return Number(sale.totals?.subtotal ?? Math.max(0, saleTotal(sale) - saleTip(sale)) ?? 0);
}

function saleIvaRate(sale) {
  const enabled = sale?.totals?.ivaEnabled === true || sale?.totals?.taxEnabled === true || sale?.payment?.ivaEnabled === true || sale?.payment?.taxEnabled === true || sale?.ivaEnabled === true || sale?.taxEnabled === true;
  if (!enabled) return 0;
  const storedRate = sale?.totals?.ivaRate ?? sale?.totals?.taxRate ?? sale?.payment?.ivaRate ?? sale?.payment?.taxRate;
  if (storedRate !== undefined && storedRate !== null) return cleanIvaRate(storedRate);
  const storedIva = Number(sale?.totals?.iva ?? sale?.totals?.taxAmount ?? sale?.payment?.iva ?? sale?.payment?.taxAmount);
  return storedIva > 0 ? DEFAULT_IVA_RATE : 0;
}

function saleTaxBreakdown(sale) {
  const gross = roundCurrency(saleSubtotal(sale));
  const ivaRate = saleIvaRate(sale);
  const storedNet = Number(sale?.totals?.netSubtotal ?? sale?.totals?.taxableSubtotal);
  const storedIva = Number(sale?.totals?.iva ?? sale?.totals?.taxAmount);
  if (ivaRate > 0 && Number.isFinite(storedNet) && Number.isFinite(storedIva)) {
    return {
      gross,
      netSubtotal: roundCurrency(storedNet),
      iva: roundCurrency(storedIva),
      ivaRate,
    };
  }
  return {
    gross,
    netSubtotal: gross,
    iva: 0,
    ivaRate: 0,
  };
}

function saleNetSubtotal(sale) {
  return saleTaxBreakdown(sale).netSubtotal;
}

function saleIvaAmount(sale) {
  return saleTaxBreakdown(sale).iva;
}

function saleTip(sale) {
  return Number(sale.totals?.tip ?? sale.tip?.amount ?? 0);
}

function saleTipPaymentMethod(sale) {
  return sale.tip?.paymentMethod || sale.totals?.tipPaymentMethod || sale.paymentMethod || "Efectivo";
}

function paymentBucket(method) {
  return normalize(method).includes("tarjeta") ? "card" : "cash";
}

function paymentTotalsForSales(sales = []) {
  return sales.reduce(
    (acc, sale) => {
      const subtotal = saleSubtotal(sale);
      const tip = saleTip(sale);
      const iva = saleIvaAmount(sale);
      const saleBucket = paymentBucket(sale.paymentMethod);
      const tipBucket = paymentBucket(saleTipPaymentMethod(sale));
      if (saleBucket === "card") {
        acc.card += subtotal;
        acc.cardSales += subtotal;
      } else {
        acc.cash += subtotal;
        acc.cashSales += subtotal;
      }
      if (tipBucket === "card") {
        acc.card += tip;
        acc.cardTips += tip;
      } else {
        acc.cash += tip;
        acc.cashTips += tip;
      }
      acc.total += subtotal + tip;
      acc.tips += tip;
      acc.iva += iva;
      acc.count += 1;
      return acc;
    },
    { cash: 0, card: 0, total: 0, tips: 0, iva: 0, cashSales: 0, cardSales: 0, cashTips: 0, cardTips: 0, count: 0 },
  );
}

function canAdjustSaleTip(sale, user = currentUser()) {
  const session = currentCashSession();
  if (!sale || !session || sale.cashSessionId !== session.id) return false;
  return sale.cashierId === user?.id || hasCashAccess(user);
}

function currentCashSession() {
  return normalizeCashSessions(state.cashSessions)
    .filter((session) => session.status === "open")
    .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))[0] || null;
}

function salesForCashSession(session) {
  if (!session) return [];
  return state.sales
    .filter((sale) => sale.cashSessionId === session.id)
    .sort((a, b) => new Date(saleClosedAt(b)) - new Date(saleClosedAt(a)));
}

function cashSessionTotals(session) {
  const openingCash = Number(session?.openingCash) || 0;
  const payments = paymentTotalsForSales(salesForCashSession(session));
  const cashExpenses = cashExpensesForSession(session);
  return {
    ...payments,
    openingCash,
    cashExpenses,
    expectedCash: openingCash + payments.cash - cashExpenses,
  };
}

function cashSessionDisplayTotals(session) {
  const calculated = cashSessionTotals(session);
  if (session?.status !== "closed") return calculated;
  const cashSales = Number(session.cashSales ?? calculated.cashSales ?? calculated.cash) || 0;
  const cardSales = Number(session.cardSales ?? calculated.cardSales ?? calculated.card) || 0;
  const totalSales = Number(session.totalSales ?? calculated.totalSales ?? calculated.total) || 0;
  return {
    ...calculated,
    ...session,
    openingCash: Number(session.openingCash ?? calculated.openingCash) || 0,
    cash: cashSales,
    card: cardSales,
    total: totalSales,
    cashSales,
    cardSales,
    totalSales,
    iva: (session.ivaEnabled === true || session.taxEnabled === true) ? (Number(session.iva) || 0) : (calculated.iva || 0),
    cashExpenses: Number(session.cashExpenses ?? calculated.cashExpenses) || 0,
    cashTips: Number(session.cashTips ?? calculated.cashTips) || 0,
    cardTips: Number(session.cardTips ?? calculated.cardTips) || 0,
    tips: Number(session.tips ?? calculated.tips) || 0,
    expectedCash: Number(session.expectedCash ?? calculated.expectedCash) || 0,
  };
}

function cashExpensesForSession(session) {
  if (!session?.id) return 0;
  return normalizeExpenses(state.expenses)
    .filter((expense) => expense.cashSessionId === session.id)
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
}

function lastClosedCashSession() {
  return normalizeCashSessions(state.cashSessions)
    .filter((session) => session.status === "closed")
    .sort((a, b) => new Date(b.closedAt || b.openedAt) - new Date(a.closedAt || a.openedAt))[0] || null;
}

function renderTimeClockPanel() {
  const users = state.users.filter((user) => user.active);
  return `
    <section class="panel data-grid-wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Fichaje</h2>
          <p class="panel-kicker">Entrada y salida por usuario</p>
        </div>
      </div>
      <div class="panel-body clock-grid">
        ${users
          .map((user) => {
            const shift = currentShift(user.id);
            const active = Boolean(shift);
            return `
              <article class="clock-card ${active ? "is-active" : ""}">
                <div>
                  <strong>${escapeHtml(user.name)}</strong>
                  <span>${active ? `Dentro · ${formatDuration(shiftMinutes(shift))}` : "Fuera de turno"}</span>
                  <small>${active ? `Entrada ${formatTime(shift.clockInAt)}` : `Hoy acumulado ${formatDuration(attendanceTodayMinutes(user.id))}`}</small>
                </div>
                <button class="${active ? "danger-button" : "primary-button"}" data-clock-action="${user.id}:${active ? "out" : "in"}">
                  ${svg(active ? "logout" : "clock")}${active ? "Salida" : "Entrada"}
                </button>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderUserClockCard(user) {
  const shift = currentShift(user.id);
  const active = Boolean(shift);
  return `
    <article class="clock-card ${active ? "is-active" : ""}">
      <div>
        <strong>${escapeHtml(user.name)}</strong>
        <span>${active ? `Dentro · ${formatDuration(shiftMinutes(shift))}` : "Fuera de turno"}</span>
        <small>${active ? `Entrada ${formatTime(shift.clockInAt)}` : `Hoy acumulado ${formatDuration(attendanceTodayMinutes(user.id))}`}</small>
      </div>
      <button class="${active ? "danger-button" : "primary-button"}" data-clock-action="${user.id}:${active ? "out" : "in"}">
        ${svg(active ? "logout" : "clock")}${active ? "Salida" : "Entrada"}
      </button>
    </article>
  `;
}

function renderAttendanceHistory(userId = null) {
  const shifts = [...(state.attendance || [])]
    .filter((shift) => !userId || shift.userId === userId)
    .sort((a, b) => new Date(b.clockInAt) - new Date(a.clockInAt))
    .slice(0, 30);
  return `
    <section class="panel data-grid-wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Historial de fichajes</h2>
          <p class="panel-kicker">Ultimos registros de entrada y salida</p>
        </div>
      </div>
      <div class="panel-body table-wrap">
        <table class="data-table">
          <thead><tr><th>Usuario</th><th>Entrada</th><th>Salida</th><th>Tiempo</th><th>Estado</th></tr></thead>
          <tbody>
            ${
              shifts.length
                ? shifts
                    .map(
                      (shift) => `
                        <tr>
                          <td><strong>${escapeHtml(waiterName(shift.userId))}</strong></td>
                          <td>${formatDateTime(shift.clockInAt)}</td>
                          <td>${shift.clockOutAt ? formatDateTime(shift.clockOutAt) : "Activo"}</td>
                          <td>${formatDuration(shiftMinutes(shift))}</td>
                          <td><span class="shift-status ${shift.clockOutAt ? "" : "is-active"}">${shift.clockOutAt ? "Cerrado" : "Activo"}</span></td>
                        </tr>
                      `,
                    )
                    .join("")
                : `<tr><td colspan="5">Aun no hay fichajes.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAdminAccessQr() {
  if (!isAdminUser()) return "";
  const url = appAccessUrl();
  const qr = qrSvgFor(url);
  if (!qr) return "";
  return `
    <section class="panel admin-qr-panel">
      <div class="admin-qr-code" aria-label="Codigo QR de acceso a LibrePOS">
        ${qr}
      </div>
      <div class="admin-qr-copy">
        <strong>Acceso web</strong>
        <span>${escapeHtml(url)}</span>
      </div>
    </section>
  `;
}

function renderProfile() {
  const user = currentUser();
  const stats = buildUserStatsForDay(new Date())[user.id] || emptyStats();
  const shift = currentShift(user.id);
  const shiftLabel = shift ? `Dentro · ${formatDuration(shiftMinutes(shift))}` : "Fuera";
  const profileSalesToday = state.sales.filter(
    (sale) => isSameLocalDay(saleClosedAt(sale)) && (sale.waiterId === user.id || sale.cashierId === user.id),
  );
  const profileChargedToday = profileSalesToday.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const profileTipsToday = profileSalesToday.reduce((sum, sale) => sum + saleTip(sale), 0);
  return `
    <div class="profile-layout">
      <section class="panel profile-hero">
        <div class="profile-avatar">${escapeHtml((user.name || user.username || "U").slice(0, 1).toUpperCase())}</div>
        <div>
          <h2>${escapeHtml(user.name)}</h2>
          <p>${escapeHtml(user.username)}</p>
          ${renderUserFunctionTags(user)}
        </div>
        <button class="secondary-button mobile-profile-logout" data-logout>${svg("logout")}Cerrar sesion</button>
      </section>
      <section class="summary-grid">
        ${renderSummaryCard("Fichaje", shiftLabel)}
        ${renderSummaryCard("Ordenes hoy", String(stats.orders))}
        ${renderSummaryCard("Cobrado hoy", money.format(profileChargedToday))}
        ${renderSummaryCard("Propinas hoy", money.format(profileTipsToday))}
      </section>
      ${renderAdminAccessQr()}
      ${renderProfileClosedSales(user, profileSalesToday)}
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Mi fichaje</h2>
            <p class="panel-kicker">Entrada y salida de turno</p>
          </div>
        </div>
        <div class="panel-body">
          ${renderUserClockCard(user)}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Mis estadisticas</h2>
            <p class="panel-kicker">Actividad registrada en el POS</p>
          </div>
        </div>
        <div class="panel-body metric-stack">
          <div class="total-line"><span>Ordenes de hoy</span><strong>${stats.orders}</strong></div>
          <div class="total-line"><span>Comandas de hoy</span><strong>${stats.commands}</strong></div>
          <div class="total-line"><span>Cobros de hoy</span><strong>${stats.charges}</strong></div>
          <div class="total-line"><span>Propinas de hoy</span><strong>${money.format(profileTipsToday)}</strong></div>
          <div class="total-line"><span>Total cobrado hoy</span><strong>${money.format(profileChargedToday)}</strong></div>
        </div>
      </section>
      ${renderAttendanceHistory(user.id)}
    </div>
  `;
}

function renderProfileClosedSales(user, sales = []) {
  const rows = [...sales]
    .sort((a, b) => new Date(saleClosedAt(b)) - new Date(saleClosedAt(a)))
    .slice(0, 24);
  return `
    <section class="panel profile-sales-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Mesas atendidas y cobradas</h2>
          <p class="panel-kicker">Recap de cierres del dia y propinas posteriores</p>
        </div>
      </div>
      <div class="panel-body table-wrap">
        <table class="data-table profile-sales-table">
          <thead><tr><th>Hora</th><th>Mesa/orden</th><th>Pago</th><th>Propina</th><th>Total</th><th></th></tr></thead>
          <tbody>
            ${
              rows.length
                ? rows
                    .map((sale) => {
                      const canAdjust = canAdjustSaleTip(sale, user);
                      const tip = saleTip(sale);
                      return `
                        <tr>
                          <td>${formatDateTime(saleClosedAt(sale))}</td>
                          <td>
                            <strong>${escapeHtml(sale.label || sale.orderId || "Venta")}</strong>
                            <small>${sale.cashierId === user.id ? "Cerrada por ti" : `Mesero ${escapeHtml(waiterName(sale.waiterId))}`}</small>
                            <small>ID ${escapeHtml(orderNumberLabel(sale))}</small>
                          </td>
                          <td>${escapeHtml(sale.paymentMethod || "Efectivo")}</td>
                          <td>${money.format(tip)}<small>${escapeHtml(saleTipPaymentMethod(sale))}</small></td>
                          <td><strong>${money.format(saleTotal(sale))}</strong></td>
                          <td class="row-actions sale-recap-actions">
                            <button class="secondary-button compact" data-open-modal="adjust-tip" data-sale-id="${sale.id}" ${canAdjust ? "" : "disabled"}>
                              ${svg("cash")}Propina
                            </button>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
                : `<tr><td colspan="6">Aun no tienes mesas cerradas hoy.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderUsersOverview(users) {
  const inShift = users.filter((user) => currentShift(user.id)).length;
  const admins = users.filter((user) => normalizeUserFunctions(user).includes("admin")).length;
  const kitchen = users.filter((user) => hasUserFunction(user, "cocina")).length;
  const waiters = users.filter((user) => hasUserFunction(user, "mesero")).length;
  return `
    <section class="summary-grid">
      ${renderSummaryCard("Usuarios activos", String(users.length))}
      ${renderSummaryCard("Fichados", String(inShift))}
      ${renderSummaryCard("Meseros", String(waiters))}
      ${renderSummaryCard("Cocina/Admin", `${kitchen}/${admins}`)}
    </section>
  `;
}

function renderUsers() {
  const stats = buildUserStats();
  const users = state.users.filter((user) => user.active);
  return `
    <div class="users-admin-layout">
      <section class="board-header">
        <div>
          <h2>Usuarios</h2>
          <p>Gestion de accesos, funciones y contrasenas</p>
        </div>
        <button class="primary-button" data-open-modal="new-user">${svg("plus")}Nuevo usuario</button>
      </section>
      ${renderUsersOverview(users)}
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Equipo activo</h2>
            <p class="panel-kicker">Funciones, actividad y acciones administrativas</p>
          </div>
        </div>
        <div class="panel-body table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Funciones</th>
                <th>Fichaje</th>
                <th>Hoy</th>
                <th>Ordenes</th>
                <th>Comandas</th>
                <th>Cobros</th>
                <th>Cobrado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${users
                .map((user) => {
                  const item = stats[user.id] || emptyStats();
                  const shift = currentShift(user.id);
                  const canDelete = canDeleteUser(user.id);
                  return `
                    <tr>
                      <td><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.username)}</small></td>
                      <td>${renderUserFunctionTags(user)}</td>
                      <td><span class="shift-status ${shift ? "is-active" : ""}">${shift ? `Dentro · ${formatDuration(shiftMinutes(shift))}` : "Fuera"}</span></td>
                      <td>${formatDuration(attendanceTodayMinutes(user.id))}</td>
                      <td>${item.orders}</td>
                      <td>${item.commands}</td>
                      <td>${item.charges}</td>
                      <td><strong>${money.format(item.charged)}</strong></td>
                      <td class="row-actions user-row-actions">
                        <button class="${shift ? "danger-button" : "primary-button"} compact" data-clock-action="${user.id}:${shift ? "out" : "in"}">
                          ${svg(shift ? "logout" : "clock")}${shift ? "Terminar fichaje" : "Fichar entrada"}
                        </button>
                        <button class="secondary-button compact" data-open-modal="edit-user" data-user-id="${user.id}">${svg("note")}Editar</button>
                        <button class="secondary-button compact" data-reset-password="${user.id}">${svg("transfer")}Resetear clave</button>
                        <details class="user-danger-menu">
                          <summary class="ghost-button compact" title="Más acciones">${svg("minus")}</summary>
                          <div class="user-danger-menu-body">
                            <button class="danger-button compact" data-delete-user="${user.id}" ${canDelete ? "" : "disabled"} title="${canDelete ? `Borrar a ${escapeAttr(user.name)}` : "No se puede borrar el último admin"}">${svg("trash")}Borrar usuario</button>
                          </div>
                        </details>
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
      ${renderAttendanceHistory()}
    </div>
  `;
}

function bindLogin() {
  document.querySelector("[data-login-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    const user = await authenticateUser(username, password);
    if (!user) {
      state.authError = "Usuario o contrasena incorrectos.";
      persist();
      render();
      return;
    }
    state.authError = "";
    state.sessionUserId = user.id;
    persist();
    render();
    checkForUpdates();
  });
}

async function authenticateUser(username, password) {
  const loginUsername = cleanUserText(username);
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: loginUsername, password }),
    });
    if (response.ok) {
      const payload = await response.json();
      syncEnabled = true;
      syncVersion = Number(payload.version) || syncVersion;
      if (payload.state) {
        applySharedState(payload.state);
        syncLastPayload = JSON.stringify(sharedStateFromCurrent());
        persistLocal();
      }
      return state.users.find((item) => item.active && item.id === payload.userId) || null;
    }
    if (response.status === 401) return null;
  } catch {
    // Fall back to local login when the sync server is not running.
  }
  return state.users.find((item) => item.active && sameUsername(item.username, loginUsername) && item.password === password) || null;
}

function closeModal() {
  state.modal = null;
  state.productConfig = null;
  persist();
  render();
}

function bindEvents() {
  document.querySelector("[data-apply-update]")?.addEventListener("click", applyUpdate);
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.nav;
      state.productConfig = null;
      state.modal = null;
      persist();
      render();
    });
  });
  document.querySelectorAll("[data-nav-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const totalItems = availableNavItems().length + 1;
      const maxPage = Math.max(0, Math.ceil(totalItems / 5) - 1);
      state.navPage = Math.min(Math.max((Number(state.navPage) || 0) + Number(button.dataset.navScroll), 0), maxPage);
      persist();
      render();
    });
  });
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      state.sessionUserId = null;
      state.activeOrderId = null;
      state.productConfig = null;
      state.modal = null;
      persist();
      render();
    });
  });
  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = { type: button.dataset.openModal };
      if (button.dataset.tableNumber) modal.tableNumber = Number(button.dataset.tableNumber);
      if (button.dataset.orderId) modal.orderId = button.dataset.orderId;
      if (button.dataset.lineId) modal.lineId = button.dataset.lineId;
      if (button.dataset.commandId) modal.commandId = button.dataset.commandId;
      if (button.dataset.cancelSource) modal.cancelSource = button.dataset.cancelSource;
      if (button.dataset.userId) modal.userId = button.dataset.userId;
      if (button.dataset.saleId) modal.saleId = button.dataset.saleId;
      if (button.dataset.productId) modal.productId = button.dataset.productId;
      if (button.dataset.ingredientId) modal.ingredientId = button.dataset.ingredientId;
      if (button.dataset.ingredientCategory) modal.ingredientCategory = button.dataset.ingredientCategory;
      if (button.dataset.extraId) modal.extraId = button.dataset.extraId;
      if (modal.type === "iva-price-conversion") {
        modal.exampleSeed = Date.now();
        modal.exampleLimit = 3;
      }
      state.modal = modal;
      persist();
      render();
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach((backdrop) => {
    backdrop.addEventListener("pointerdown", (event) => {
      backdrop.dataset.pointerStartedOnBackdrop = String(event.target === backdrop);
    });
    backdrop.addEventListener("click", (event) => {
      const startedOnBackdrop = backdrop.dataset.pointerStartedOnBackdrop === "true";
      delete backdrop.dataset.pointerStartedOnBackdrop;
      if (event.target !== backdrop || !startedOnBackdrop) return;
      closeModal();
    });
  });
  document.querySelectorAll("[data-close-modal-button]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });
  document.querySelector("[data-open-table-form]")?.addEventListener("submit", submitOpenTable);
  const openTableSubmit = document.querySelector("[data-open-table-submit]");
  openTableSubmit?.addEventListener("click", submitOpenTable);
  openTableSubmit?.addEventListener("touchend", submitOpenTable, { passive: false });
  document.querySelector("[data-open-takeout-form]")?.addEventListener("submit", openTakeout);
  document.querySelector("[data-table-note-form]")?.addEventListener("submit", saveTableNote);
  document.querySelector("[data-line-note-form]")?.addEventListener("submit", saveLineNote);
  document.querySelector("[data-cancel-order-form]")?.addEventListener("submit", cancelOrderFromForm);
  document.querySelector("[data-cancel-line-form]")?.addEventListener("submit", cancelLineFromForm);
  document.querySelectorAll("[data-close-order]").forEach((button) => {
    button.addEventListener("click", () => openCheckout(button.dataset.closeOrder));
  });
  document.querySelectorAll("[data-print-prepaid-order]").forEach((button) => {
    button.addEventListener("click", () => printPrepaidOrderReceipt(button.dataset.printPrepaidOrder));
  });
  document.querySelectorAll("[data-print-postpaid-sale]").forEach((button) => {
    button.addEventListener("click", () => printPostpaidSaleReceipt(button.dataset.printPostpaidSale));
  });
  document.querySelectorAll("[data-dismiss-postpaid-warning]").forEach((button) => {
    button.addEventListener("click", () => dismissPostpaidTicketWarning(button.dataset.dismissPostpaidWarning));
  });
  document.querySelector("[data-dismiss-filtered-postpaid-warnings]")?.addEventListener("click", dismissFilteredPostpaidTicketWarnings);
  document.querySelector("[data-print-pending-postpaid]")?.addEventListener("click", printFilteredPendingPostpaidTickets);
  const checkoutForm = document.querySelector("[data-checkout-form]");
  checkoutForm?.addEventListener("submit", confirmCheckoutPayment);
  checkoutForm?.addEventListener("input", updateCheckoutPaymentPreview);
  checkoutForm?.addEventListener("change", updateCheckoutPaymentPreview);
  if (checkoutForm) updateCheckoutPaymentPreview();
  document.querySelector("[data-adjust-tip-form]")?.addEventListener("submit", saveSaleTip);
  document.querySelectorAll("[data-clear-alert]").forEach((button) => {
    button.addEventListener("click", () => clearOrderAlert(button.dataset.clearAlert));
  });
  document.querySelectorAll("[data-open-order]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeOrderId = button.dataset.openOrder;
      state.view = "sale";
      state.productConfig = null;
      state.modal = null;
      persist();
      render();
    });
  });
  document.querySelector("[data-back-home]")?.addEventListener("click", () => {
    state.activeOrderId = null;
    state.productConfig = null;
    state.modal = null;
    persist();
    render();
  });
  const search = document.querySelector("[data-search]");
  if (search) {
    search.addEventListener("input", (event) => {
      const caret = event.target.selectionStart || event.target.value.length;
      state.productSearch = event.target.value;
      persist();
      render();
      const restored = document.querySelector("[data-search]");
      restored?.focus();
      restored?.setSelectionRange(caret, caret);
    });
  }
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSection = button.dataset.section;
      state.activeSubsection = "Todos";
      state.productConfig = null;
      state.modal = null;
      persist();
      render();
    });
  });
  document.querySelectorAll("[data-subsection]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSubsection = button.dataset.subsection;
      state.productConfig = null;
      state.modal = null;
      persist();
      render();
    });
  });
  document.querySelector("[data-mobile-section]")?.addEventListener("change", (event) => {
    state.activeSection = event.target.value;
    state.activeSubsection = "Todos";
    state.productConfig = null;
    state.modal = null;
    persist();
    render();
  });
  document.querySelector("[data-mobile-subsection]")?.addEventListener("change", (event) => {
    state.activeSubsection = event.target.value;
    state.productConfig = null;
    state.modal = null;
    persist();
    render();
  });
  document.querySelectorAll("[data-configure-product]").forEach((button) => {
    button.addEventListener("click", () => startProductConfig(button.dataset.configureProduct));
  });
  // Eventos específicos del modal de configuración (incluido cerrar).
  if (state.productConfig) bindProductConfigEvents();
  document.querySelectorAll("[data-line-qty]").forEach((button) => {
    button.addEventListener("click", () => updateLineQty(button.dataset.lineQty, Number(button.dataset.delta)));
  });
  document.querySelectorAll("[data-remove-line]").forEach((button) => {
    button.addEventListener("click", () => removeLine(button.dataset.removeLine));
  });
  document.querySelectorAll("[data-edit-line]").forEach((button) => {
    button.addEventListener("click", () => startEditLineConfig(button.dataset.editLine));
  });
  document.querySelectorAll("[data-command-mode]").forEach((button) => {
    button.addEventListener("click", () => commandPending(button.dataset.commandMode, button));
  });
  document.querySelectorAll("[data-finalize-order]").forEach((button) => {
    button.addEventListener("click", (event) => finalizeOrder(event.currentTarget));
  });
  document.querySelector("[data-user-form]")?.addEventListener("submit", createUser);
  document.querySelector("[data-edit-user-form]")?.addEventListener("submit", editUser);
  document.querySelectorAll("[data-reset-password]").forEach((button) => {
    button.addEventListener("click", () => resetUserPassword(button.dataset.resetPassword));
  });
  document.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", () => deleteUser(button.dataset.deleteUser));
  });
  document.querySelectorAll("[data-clock-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const [userId, action] = button.dataset.clockAction.split(":");
      toggleClock(userId, action);
    });
  });
  document.querySelectorAll("[data-reset-action]").forEach((button) => {
    button.addEventListener("click", () => resetData(button.dataset.resetAction));
  });
  document.querySelector("[data-inventory-add-form]")?.addEventListener("submit", addInventoryItem);
  document.querySelector("[data-inventory-adjust-form]")?.addEventListener("submit", adjustInventoryFromForm);
  document.querySelector("[data-inventory-purchase-form]")?.addEventListener("submit", submitInventoryPurchase);
  document.querySelector("[data-inventory-waste-form]")?.addEventListener("submit", submitInventoryWaste);
  const fullInventoryForm = document.querySelector("[data-full-inventory-form]");
  fullInventoryForm?.addEventListener("input", () => updateFullInventoryPreview(fullInventoryForm));
  fullInventoryForm?.addEventListener("submit", applyFullInventoryCount);
  const menuProductForm = document.querySelector("[data-menu-product-form]");
  menuProductForm?.addEventListener("submit", saveMenuProduct);
  menuProductForm?.addEventListener("keydown", preventMenuProductEnterSubmit);
  menuProductForm?.addEventListener("input", updateMenuProductFormPreviewFromEvent);
  menuProductForm?.addEventListener("change", updateMenuProductFormPreviewFromEvent);
  if (menuProductForm) updateMenuProductPricePreview(menuProductForm);
  document.querySelectorAll("[data-add-recipe-row]").forEach((button) => {
    button.addEventListener("click", () => addRecipeRow(button));
  });
  document.querySelectorAll("[data-add-variant-row]").forEach((button) => {
    button.addEventListener("click", () => addVariantRecipeRow(button));
  });
  document.querySelectorAll("[data-variant-active]").forEach((input) => {
    input.addEventListener("change", () => updateVariantActivePreview(input));
  });
  document.querySelector("[data-add-variant-choice]")?.addEventListener("click", (event) => {
    addVariantChoice(event.currentTarget);
  });
  document.querySelector("[data-ingredient-form]")?.addEventListener("submit", saveIngredient);
  document.querySelector("[data-ingredient-category-form]")?.addEventListener("submit", createIngredientCategory);
  document.querySelector("[data-extra-form]")?.addEventListener("submit", saveExtraDefinition);
  document.querySelectorAll("[data-ingredient-category-field]").forEach((input) => {
    input.addEventListener("change", () => updateIngredientCategory(input.dataset.ingredientCategoryField, input.value));
  });
  document.querySelectorAll("[data-ingredient-recipe-toggle]").forEach((input) => {
    input.addEventListener("change", (event) => {
      setIngredientRecipeEligible(input.dataset.ingredientRecipeToggle, event.target.checked);
    });
  });
  document.querySelectorAll("[data-menu-product-toggle]").forEach((button) => {
    button.addEventListener("click", () => toggleMenuProduct(button.dataset.menuProductToggle));
  });
  document.querySelectorAll("[data-menu-product-active]").forEach((input) => {
    input.addEventListener("change", (event) => {
      setMenuProductActive(input.dataset.menuProductActive, event.target.checked);
    });
  });
  document.querySelectorAll("[data-extra-active]").forEach((input) => {
    input.addEventListener("change", (event) => {
      setExtraActive(input.dataset.extraActive, event.target.checked);
    });
  });
  document.querySelectorAll("[data-recipes-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.recipesMode = button.dataset.recipesMode;
      state.modal = null;
      persist();
      render();
    });
  });
  document.querySelectorAll("[data-recipes-section]").forEach((button) => {
    button.addEventListener("click", () => {
      state.recipesSection = button.dataset.recipesSection;
      state.recipesSubsection = "Todos";
      persist();
      render();
    });
  });
  document.querySelectorAll("[data-recipes-subsection]").forEach((button) => {
    button.addEventListener("click", () => {
      state.recipesSubsection = button.dataset.recipesSubsection;
      persist();
      render();
    });
  });
  const recipesSearch = document.querySelector("[data-recipes-search]");
  recipesSearch?.addEventListener("input", (event) => {
    const caret = event.target.selectionStart || event.target.value.length;
    state.recipesSearch = event.target.value;
    persist();
    render();
    const restored = document.querySelector("[data-recipes-search]");
    restored?.focus();
    restored?.setSelectionRange(caret, caret);
  });
  const ingredientsCategoryRow = document.querySelector("[data-ingredients-category-scroll]");
  if (ingredientsCategoryRow) ingredientsCategoryRow.scrollLeft = Number(state.ingredientsCategoryScroll) || 0;
  document.querySelectorAll("[data-ingredients-category-step]").forEach((button) => {
    button.addEventListener("click", () => scrollIngredientCategories(Number(button.dataset.ingredientsCategoryStep) || 1));
  });
  document.querySelectorAll("[data-ingredients-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ingredientsCategoryScroll = button.closest("[data-ingredients-category-scroll]")?.scrollLeft || 0;
      state.ingredientsCategory = button.dataset.ingredientsCategory;
      persist();
      render();
    });
  });
  const ingredientCategorySearch = document.querySelector("[data-ingredient-category-search]");
  ingredientCategorySearch?.addEventListener("input", (event) => {
    const caret = event.target.selectionStart || event.target.value.length;
    state.ingredientsCategorySearch = event.target.value;
    state.ingredientsCategoryScroll = 0;
    persist();
    render();
    const restored = document.querySelector("[data-ingredient-category-search]");
    restored?.focus();
    restored?.setSelectionRange(caret, caret);
  });
  const ingredientsSearch = document.querySelector("[data-ingredients-search]");
  ingredientsSearch?.addEventListener("input", (event) => {
    const caret = event.target.selectionStart || event.target.value.length;
    state.ingredientsSearch = event.target.value;
    persist();
    render();
    const restored = document.querySelector("[data-ingredients-search]");
    restored?.focus();
    restored?.setSelectionRange(caret, caret);
  });
  const extrasSearch = document.querySelector("[data-extras-search]");
  extrasSearch?.addEventListener("input", (event) => {
    const caret = event.target.selectionStart || event.target.value.length;
    state.extrasSearch = event.target.value;
    persist();
    render();
    const restored = document.querySelector("[data-extras-search]");
    restored?.focus();
    restored?.setSelectionRange(caret, caret);
  });
  const orderSearch = document.querySelector("[data-order-search]");
  orderSearch?.addEventListener("input", (event) => {
    const caret = event.target.selectionStart || event.target.value.length;
    state.dataOrderSearch = event.target.value;
    persist();
    render();
    const restored = document.querySelector("[data-order-search]");
    restored?.focus();
    restored?.setSelectionRange(caret, caret);
  });
  document.querySelector("[data-order-from]")?.addEventListener("change", (event) => {
    state.dataOrderFrom = event.target.value;
    persist();
    render();
  });
  document.querySelector("[data-order-to]")?.addEventListener("change", (event) => {
    state.dataOrderTo = event.target.value;
    persist();
    render();
  });
  document.querySelectorAll("[data-order-status]").forEach((button) => {
    button.addEventListener("click", () => {
      state.dataOrderStatus = button.dataset.orderStatus || "all";
      persist();
      render();
    });
  });
  document.querySelector("[data-order-search-clear]")?.addEventListener("click", () => {
    state.dataOrderSearch = "";
    state.dataOrderFrom = "";
    state.dataOrderTo = "";
    state.dataOrderStatus = "all";
    persist();
    render();
  });
  document.querySelector("[data-expense-form]")?.addEventListener("submit", addExpense);
  document.querySelectorAll("[data-export-data]").forEach((button) => {
    button.addEventListener("click", () => exportData(button.dataset.exportData));
  });
  document.querySelectorAll("[data-config-tab]").forEach((button) => {
    button.addEventListener("click", () => setConfigTab(button.dataset.configTab));
  });
  document.querySelectorAll("[data-printing-tab]").forEach((button) => {
    button.addEventListener("click", () => setPrintingTab(button.dataset.printingTab));
  });
  document.querySelector("[data-iva-enabled]")?.addEventListener("change", (event) => {
    saveIvaEnabled(event.target.checked);
  });
  document.querySelector("[data-iva-rate]")?.addEventListener("change", (event) => {
    saveIvaRatePercent(event.target.value);
  });
  document.querySelector("[data-reset-folios-form]")?.addEventListener("submit", resetOrderFolios);
  document.querySelector("[data-iva-price-conversion-form]")?.addEventListener("submit", applyIvaBasePriceConversion);
  document.querySelector("[data-more-iva-price-examples]")?.addEventListener("click", showMoreIvaPriceExamples);
  if (document.querySelector("[data-printer-panel]")) {
    loadPrinterList();
    if (activePrintingTab() === "tickets") loadFakeReceiptPreview();
    document.querySelector("[data-printer-manual]")?.addEventListener("input", (event) => {
      printerRuntime.manualName = event.target.value;
    });
    document.querySelector("[data-printer-manual]")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      selectPrinterFromList();
    });
    document.querySelector("[data-command-printer-manual]")?.addEventListener("input", (event) => {
      printerRuntime.manualCommandName = event.target.value;
    });
    document.querySelector("[data-command-printer-manual]")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      selectCommandPrinterFromList();
    });
    document.querySelector("[data-command-print-enabled]")?.addEventListener("change", (event) => {
      saveCommandAutoPrint(event.target.checked);
    });
    document.querySelectorAll("[data-ticket-margin-mm]").forEach((input) => {
      input.addEventListener("change", (event) => {
        saveTicketMarginMm(event.target.dataset.ticketMarginSide, event.target.value);
      });
      input.addEventListener("input", (event) => {
        updateTicketMarginMm(event.target.dataset.ticketMarginSide, event.target.value);
      });
    });
    document.querySelector("[data-ticket-logo-file]")?.addEventListener("change", changeTicketLogo);
    document.querySelector("[data-ticket-logo-width-mm]")?.addEventListener("change", (event) => {
      saveTicketLogoWidthMm(event.target.value);
    });
    document.querySelector("[data-ticket-logo-width-mm]")?.addEventListener("input", (event) => {
      updateTicketLogoWidthMm(event.target.value);
      refreshTicketLogoPreviewSize();
    });
    document.querySelector("[data-ticket-logo-enabled]")?.addEventListener("change", (event) => {
      setTicketLogoEnabled(event.target.checked);
    });
    document.querySelectorAll("[data-ticket-logo-position]").forEach((input) => {
      input.addEventListener("change", (event) => {
        if (event.target.checked) setTicketLogoPosition(event.target.value);
      });
    });
    document.querySelector("[data-clear-ticket-logo]")?.addEventListener("click", clearTicketLogo);
    document.querySelector("[data-select-printer]")?.addEventListener("click", selectPrinterFromList);
    document.querySelector("[data-clear-printer]")?.addEventListener("click", clearSavedPrinter);
    document.querySelector("[data-select-command-printer]")?.addEventListener("click", selectCommandPrinterFromList);
    document.querySelector("[data-clear-command-printer]")?.addEventListener("click", clearSavedCommandPrinter);
    document.querySelector("[data-print-test]")?.addEventListener("click", sendPrinterTest);
    document.querySelector("[data-print-legacy]")?.addEventListener("click", sendPrinterLegacyTest);
    document.querySelectorAll("[data-generate-fake-receipt]").forEach((button) => {
      button.addEventListener("click", () => loadFakeReceiptPreview(true, button.dataset.generateFakeReceipt));
    });
    document.querySelectorAll("[data-print-fake-receipt]").forEach((button) => {
      button.addEventListener("click", () => printFakeReceiptPreview(button.dataset.printFakeReceipt));
    });
    document.querySelector("[data-print-receipt-header]")?.addEventListener("click", printReceiptHeader);
    document.querySelector("[data-print-logo]")?.addEventListener("click", printLogoTest);
    document.querySelector("[data-refresh-command-preview]")?.addEventListener("click", refreshCommandPreview);
    document.querySelector("[data-print-command-preview]")?.addEventListener("click", printCommandPreview);
    document.querySelector("[data-remove-system-printer]")?.addEventListener("click", removeSelectedSystemPrinter);
  }
  document.querySelector("[data-cash-open-form]")?.addEventListener("submit", openCashSession);
  document.querySelector("[data-cash-close-form]")?.addEventListener("submit", closeCashSession);
  document.querySelectorAll("[data-inventory-quick]").forEach((button) => {
    button.addEventListener("click", () => {
      const [itemId, direction] = button.dataset.inventoryQuick.split(":");
      adjustInventory(itemId, direction === "in" ? 1 : -1, direction === "in" ? "Entrada rapida" : "Salida rapida");
    });
  });
  document.querySelectorAll("[data-command-status]").forEach((button) => {
    button.addEventListener("click", () => {
      const [orderId, commandId, status] = button.dataset.commandStatus.split(":");
      updateCommandStatus(orderId, commandId, status, button);
    });
  });
  document.querySelectorAll("[data-deliver-ready]").forEach((button) => {
    button.addEventListener("click", () => deliverReadyCommands(button.dataset.deliverReady, button));
  });
}

function submitOpenTable(event) {
  event.preventDefault();
  if (openTableSubmitLocked) {
    return;
  }
  const formElement = event.currentTarget.closest?.("[data-open-table-form]") || event.currentTarget;
  if (!formElement?.matches?.("[data-open-table-form]")) {
    showToast("No se encontro el formulario de mesa.");
    return;
  }
  openTableSubmitLocked = true;
  try {
    openTable(formElement);
  } catch {
    showToast("Error al abrir mesa.");
  } finally {
    window.setTimeout(() => {
      openTableSubmitLocked = false;
    }, 600);
  }
}

function openTable(formElement) {
  if (!isCashOpen()) {
    showToast("Abre caja antes de abrir una mesa.");
    state.modal = null;
    persist();
    render();
    return;
  }
  const form = new FormData(formElement);
  const tableNumber = Number(form.get("tableNumber"));
  if (!tables.includes(tableNumber)) {
    showToast("Selecciona una mesa disponible.");
    render();
    return;
  }
  const existing = getOpenOrders().find((order) => order.type === "table" && Number(order.tableNumber) === tableNumber);
  if (existing) {
    state.modal = null;
    showToast(`Mesa ${tableNumber} ya estaba abierta.`);
    persist();
    render();
    return;
  }
  const openedAt = new Date().toISOString();
  const order = {
    id: safeId("order"),
    orderNumber: nextOrderNumber(),
    dailyOrderNumber: nextDailyOrderNumber(openedAt),
    type: "table",
    tableNumber,
    guests: Math.max(1, Number(form.get("guests")) || 1),
    waiterId: String(form.get("waiterId") || currentUser().id),
    customerName: "",
    comments: String(form.get("comments") || "").trim(),
    status: "open",
    items: [],
    commandBatches: [],
    ...currentOrderTaxSnapshot(),
    openedAt,
    openedBy: currentUser().id,
  };
  state.orders.push(order);
  state.productConfig = null;
  state.modal = null;
  persist();
  showToast(`Mesa ${tableNumber} abierta. Pulsa Continuar para vender.`);
  render();
}

function saveTableNote(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const order = getOrder(event.currentTarget.dataset.orderId);
  if (!order) return;
  order.comments = String(form.get("comments") || "").trim();
  state.modal = null;
  persist();
  render();
}

function saveLineNote(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const target = findLine(event.currentTarget.dataset.lineId);
  if (!target) return;
  const note = String(form.get("note") || "").trim();
  target.line.note = note;
  syncLineNoteToBatches(target.order, target.line.id, note);
  state.modal = null;
  persist();
  render();
}

function syncLineNoteToBatches(order, lineId, note) {
  (order.commandBatches || []).forEach((batch) => {
    (batch.lines || []).forEach((line) => {
      if (line.lineId === lineId) line.note = note;
    });
  });
}

function openTakeout(event) {
  event.preventDefault();
  if (!isCashOpen()) {
    showToast("Abre caja antes de abrir una orden para llevar.");
    state.modal = null;
    persist();
    render();
    return;
  }
  const form = new FormData(event.currentTarget);
  const openedAt = new Date().toISOString();
  const order = {
    id: safeId("order"),
    orderNumber: nextOrderNumber(),
    dailyOrderNumber: nextDailyOrderNumber(openedAt),
    type: "takeout",
    tableNumber: null,
    guests: 0,
    waiterId: String(form.get("waiterId") || currentUser().id),
    customerName: String(form.get("customerName") || "Mostrador").trim() || "Mostrador",
    status: "open",
    items: [],
    commandBatches: [],
    ...currentOrderTaxSnapshot(),
    openedAt,
    openedBy: currentUser().id,
  };
  state.orders.push(order);
  state.activeOrderId = order.id;
  state.productConfig = null;
  state.modal = null;
  persist();
  render();
}

function openCheckout(orderId) {
  const order = state.orders.find((item) => item.id === orderId && item.status === "open");
  if (!order) return;
  state.modal = { type: "checkout", orderId };
  state.productConfig = null;
  persist();
  render();
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function cleanIvaRate(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate)) return DEFAULT_IVA_RATE;
  const normalized = rate > 1 ? rate / 100 : rate;
  return Math.max(0, Math.min(1, normalized));
}

function currentIvaRate() {
  return cleanIvaRate(state.settings?.ivaRate);
}

function currentIvaEnabled() {
  return Boolean(state.settings?.ivaEnabled);
}

function currentOrderTaxSnapshot() {
  return {
    ivaEnabled: currentIvaEnabled(),
    taxEnabled: currentIvaEnabled(),
    ivaRate: currentIvaRate(),
    taxRate: currentIvaRate(),
  };
}

function saveIvaEnabled(enabled) {
  state.settings = {
    ...state.settings,
    ivaEnabled: Boolean(enabled),
  };
  printerRuntime.fakeReceiptText = "";
  persist();
  render();
}

function saveIvaRatePercent(value, { rerender = true } = {}) {
  state.settings = {
    ...state.settings,
    ivaRate: cleanIvaRate(value),
  };
  printerRuntime.fakeReceiptText = "";
  persist();
  if (rerender) render();
}

function resetOrderFolios(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede resetear folios.");
    return;
  }
  const form = new FormData(event.currentTarget);
  const confirmation = String(form.get("confirm") || "").trim().toUpperCase();
  if (confirmation !== "RESET") {
    showToast("Escribe RESET para confirmar.");
    return;
  }
  const records = numericFolioRecords();
  if (!records.length) {
    showToast("No hay folios numericos para resetear.");
    state.modal = null;
    persist();
    render();
    return;
  }
  const prefix = nextAvailableFolioPrefix();
  const renamedFolios = new Set(records.map((record) => numericOrderNumber(record.orderNumber)).filter((value) => value > 0));
  const now = new Date().toISOString();
  records.forEach((record) => {
    const previous = orderNumberValue(record);
    record.orderNumber = `${prefix}${numericOrderNumber(previous)}`;
    record.previousOrderNumber = previous;
    record.folioResetPrefix = prefix;
    record.folioResetAt = now;
    record.folioResetBy = currentUser()?.id || "";
  });
  state.modal = null;
  persist();
  showToast(`Folios reseteados. ${renamedFolios.size} anteriores pasan a ${prefix}1... y el siguiente sera 1.`);
  render();
}

function showMoreIvaPriceExamples() {
  if (!state.modal || state.modal.type !== "iva-price-conversion") return;
  state.modal = {
    ...state.modal,
    exampleLimit: Math.min(ivaPriceConversionCandidates().length, Math.max(3, Number(state.modal.exampleLimit) || 3) + 5),
  };
  render();
}

function applyIvaBasePriceConversion(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede convertir precios.");
    return;
  }
  const plan = ivaPriceConversionPlan();
  if (!plan.enabled) {
    showToast("Activa IVA antes de convertir precios.");
    return;
  }
  if (plan.alreadyApplied) {
    showToast("La conversion de precios ya fue aplicada.");
    state.modal = null;
    persist();
    render();
    return;
  }
  const form = new FormData(event.currentTarget);
  const confirmation = String(form.get("confirm") || "").trim().toUpperCase();
  if (confirmation !== "IVA") {
    showToast("Escribe IVA para confirmar.");
    return;
  }
  const now = new Date().toISOString();
  const rate = currentIvaRate();
  const historyMeta = { changedAt: now, changedBy: currentUser()?.id || "" };
  const convertedProducts = menuProducts({ includeInactive: true }).map((product) => convertedProductForIva(product, rate, historyMeta));
  const convertedExtras = extraCatalog({ includeInactive: true }).map((extra) => convertedExtraForIva(extra, rate, historyMeta));
  state.menuProducts = normalizeMenuProducts(convertedProducts);
  state.extraCatalog = normalizeExtraCatalog(convertedExtras, currentInventory());
  state.settings = {
    ...state.settings,
    ivaBasePriceConversionAppliedAt: now,
    ivaBasePriceConversionRate: rate,
    ivaBasePriceConversionCount: plan.candidatesCount,
  };
  state.modal = null;
  printerRuntime.fakeReceiptText = "";
  persist();
  showToast(`Precios convertidos: ${plan.candidatesCount} importe${plan.candidatesCount === 1 ? "" : "s"} ahora usan base + IVA.`);
  render();
}

function orderIvaRate(order) {
  if (order?.ivaEnabled === true || order?.taxEnabled === true) {
    return cleanIvaRate(order.ivaRate ?? order.taxRate);
  }
  return 0;
}

function orderTaxLabel(order) {
  const rate = orderIvaRate(order);
  return rate > 0 ? `${ivaLabel(rate)} activo` : "IVA 0";
}

function allFolioRecords() {
  return [
    ...(Array.isArray(state.orders) ? state.orders : []),
    ...(Array.isArray(state.sales) ? state.sales : []),
  ].filter((record) => orderNumberValue(record));
}

function alphabeticPrefix(index) {
  let value = Number(index) || 0;
  let label = "";
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return label;
}

function usedFolioPrefixes(records = allFolioRecords()) {
  return new Set(
    records
      .map((record) => orderNumberValue(record).toUpperCase().match(/^([A-Z]+)\d+$/)?.[1])
      .filter(Boolean),
  );
}

function nextAvailableFolioPrefix(records = allFolioRecords()) {
  const used = usedFolioPrefixes(records);
  for (let index = 0; index < 702; index += 1) {
    const prefix = alphabeticPrefix(index);
    if (!used.has(prefix)) return prefix;
  }
  return `R${Date.now().toString(36).toUpperCase()}`;
}

function numericFolioRecords() {
  return allFolioRecords().filter((record) => numericOrderNumber(record.orderNumber) > 0);
}

function resetFolioPlan() {
  const records = allFolioRecords();
  const numericFolios = new Set(records.map((record) => numericOrderNumber(record.orderNumber)).filter((value) => value > 0));
  return {
    prefix: nextAvailableFolioPrefix(records),
    count: numericFolios.size,
  };
}

function convertBasePriceToGross(price, rate = currentIvaRate()) {
  const value = roundCurrency(price);
  const ivaRate = cleanIvaRate(rate);
  return roundCurrency(value * (1 + ivaRate));
}

function ivaPriceConversionAlreadyApplied() {
  return Boolean(state.settings?.ivaBasePriceConversionAppliedAt);
}

function ivaPriceConversionCandidates() {
  const products = menuProducts({ includeInactive: true }).map((product) => ({
    id: `product:${product.id}`,
    kind: "Producto",
    name: product.name,
    price: Number(product.price) || 0,
  }));
  const extras = extraCatalog({ includeInactive: true }).map((extra) => ({
    id: `extra:${extra.id}`,
    kind: "Extra",
    name: extra.name,
    price: Number(extra.price) || 0,
  }));
  const variantPrices = menuProducts({ includeInactive: true }).flatMap((product) => (
    normalizeProductOptions(product.options).flatMap((option) => (
      option.choices
        .map((choice, index) => {
          if (Number.isFinite(Number(choice.price))) {
            return {
              id: `choice-price:${product.id}:${option.id}:${index}`,
              kind: "Variante",
              name: `${product.name} · ${choice.label}`,
              price: Number(choice.price),
            };
          }
          if (Number.isFinite(Number(choice.priceDelta)) && Number(choice.priceDelta) > 0) {
            return {
              id: `choice-delta:${product.id}:${option.id}:${index}`,
              kind: "Ajuste",
              name: `${product.name} · ${choice.label}`,
              price: Number(choice.priceDelta),
            };
          }
          return null;
        })
        .filter(Boolean)
    ))
  ));
  return [...products, ...extras, ...variantPrices].filter((item) => item.price > 0);
}

function seededSortValue(text, seed = 0) {
  const value = String(`${seed}:${text}`);
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function ivaPriceConversionExamples(limit = 3, seed = 1) {
  const rate = currentIvaRate();
  return ivaPriceConversionCandidates()
    .map((item) => ({
      ...item,
      nextPrice: convertBasePriceToGross(item.price, rate),
      iva: roundCurrency(convertBasePriceToGross(item.price, rate) - roundCurrency(item.price)),
      sort: seededSortValue(item.id, seed),
    }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, Math.max(1, Number(limit) || 3));
}

function ivaPriceConversionPlan() {
  const rate = currentIvaRate();
  const candidates = ivaPriceConversionCandidates();
  return {
    rate,
    ratePercent: formatPlainNumber(rate * 100),
    enabled: currentIvaEnabled(),
    alreadyApplied: ivaPriceConversionAlreadyApplied(),
    candidatesCount: candidates.length,
    productsCount: menuProducts({ includeInactive: true }).length,
    extrasCount: extraCatalog({ includeInactive: true }).length,
  };
}

function convertChoicePriceForIva(choice = {}, rate, historyMeta) {
  const nextChoice = { ...choice };
  if (Number.isFinite(Number(choice.price))) {
    nextChoice.price = convertBasePriceToGross(Number(choice.price), rate);
  }
  if (Number.isFinite(Number(choice.priceDelta))) {
    nextChoice.priceDelta = convertBasePriceToGross(Number(choice.priceDelta), rate);
  }
  if (nextChoice.price !== choice.price || nextChoice.priceDelta !== choice.priceDelta) {
    nextChoice.ivaBasePriceConvertedAt = historyMeta.changedAt;
    nextChoice.ivaBasePriceConvertedRate = rate;
  }
  return nextChoice;
}

function convertOptionsForIva(options = [], rate, historyMeta) {
  return normalizeProductOptions(options).map((option) => ({
    ...option,
    choices: option.choices.map((choice) => convertChoicePriceForIva(choice, rate, historyMeta)),
  }));
}

function convertedProductForIva(product, rate, historyMeta) {
  const previousPrice = roundCurrency(product.price);
  const nextPrice = convertBasePriceToGross(previousPrice, rate);
  const priceHistory = normalizeProductHistory(product.priceHistory);
  if (previousPrice !== nextPrice) {
    priceHistory.unshift({
      id: safeId("price-history"),
      changedAt: historyMeta.changedAt,
      changedBy: historyMeta.changedBy,
      reason: `Conversion IVA base + ${ivaLabel(rate)}`,
      previous: { price: previousPrice },
      next: { price: nextPrice },
    });
  }
  return {
    ...product,
    price: nextPrice,
    options: convertOptionsForIva(product.options, rate, historyMeta),
    priceHistory,
    ivaBasePriceConvertedAt: historyMeta.changedAt,
    ivaBasePriceConvertedRate: rate,
    updatedAt: historyMeta.changedAt,
    updatedBy: historyMeta.changedBy,
  };
}

function convertedExtraForIva(extra, rate, historyMeta) {
  const previousPrice = roundCurrency(extra.price);
  const nextPrice = convertBasePriceToGross(previousPrice, rate);
  const priceHistory = normalizeProductHistory(extra.priceHistory);
  if (previousPrice !== nextPrice) {
    priceHistory.unshift({
      id: safeId("price-history"),
      changedAt: historyMeta.changedAt,
      changedBy: historyMeta.changedBy,
      reason: `Conversion IVA base + ${ivaLabel(rate)}`,
      previous: { price: previousPrice },
      next: { price: nextPrice },
    });
  }
  return {
    ...extra,
    price: nextPrice,
    priceHistory,
    ivaBasePriceConvertedAt: historyMeta.changedAt,
    ivaBasePriceConvertedRate: rate,
    updatedAt: historyMeta.changedAt,
    updatedBy: historyMeta.changedBy,
  };
}

function ivaLabel(rate = currentIvaRate()) {
  return `IVA ${formatPlainNumber(cleanIvaRate(rate) * 100)}%`;
}

function taxBreakdownForGross(value, rate = currentIvaEnabled() ? currentIvaRate() : 0) {
  const gross = roundCurrency(value);
  const ivaRate = cleanIvaRate(rate);
  if (!gross || !ivaRate) {
    return { gross, netSubtotal: gross, iva: 0, ivaRate };
  }
  const netSubtotal = roundCurrency(gross / (1 + ivaRate));
  return {
    gross,
    netSubtotal,
    iva: roundCurrency(gross - netSubtotal),
    ivaRate,
  };
}

function taxBreakdownForOrder(order, value) {
  return taxBreakdownForGross(value, orderIvaRate(order));
}

function menuProductCatalogIvaRate() {
  return currentIvaEnabled() ? currentIvaRate() : 0;
}

function menuProductBasePriceFromGross(price) {
  return taxBreakdownForGross(price, menuProductCatalogIvaRate()).netSubtotal;
}

function menuProductGrossPriceFromBase(price) {
  const base = roundCurrency(Math.max(0, Number(price) || 0));
  const rate = menuProductCatalogIvaRate();
  return roundCurrency(base * (1 + rate));
}

function menuProductPriceBreakdownFromBase(price) {
  const base = roundCurrency(Math.max(0, Number(price) || 0));
  const total = menuProductGrossPriceFromBase(base);
  const rate = menuProductCatalogIvaRate();
  return {
    base,
    iva: roundCurrency(total - base),
    total,
    rate,
  };
}

function renderMenuProductPricePreview(price = 0) {
  const breakdown = menuProductPriceBreakdownFromBase(price);
  return `
    <div class="price-tax-preview" data-menu-product-price-preview>
      <span><small>Base sin IVA</small><strong data-price-preview-base>${money.format(breakdown.base)}</strong></span>
      <span><small>${escapeHtml(ivaLabel(breakdown.rate))}</small><strong data-price-preview-iva>${money.format(breakdown.iva)}</strong></span>
      <span><small>Precio final</small><strong data-price-preview-total>${money.format(breakdown.total)}</strong></span>
    </div>
  `;
}

function updateMenuProductPricePreview(formElement) {
  const form = formElement instanceof HTMLFormElement ? formElement : document.querySelector("[data-menu-product-form]");
  if (!form) return;
  const input = form.querySelector("[data-menu-product-base-price]");
  const preview = form.querySelector("[data-menu-product-price-preview]");
  if (!input || !preview) return;
  const breakdown = menuProductPriceBreakdownFromBase(input.value);
  preview.querySelector("[data-price-preview-base]").textContent = money.format(breakdown.base);
  preview.querySelector("[data-price-preview-iva]").textContent = money.format(breakdown.iva);
  preview.querySelector("[data-price-preview-total]").textContent = money.format(breakdown.total);
}

function readCheckoutTip(subtotal, form = document) {
  const box = form.querySelector?.("[data-checkout-tip]") || document.querySelector("[data-checkout-tip]");
  if (!box) return { mode: "none", value: 0, amount: 0, paymentMethod: "Efectivo" };
  const mode = box.querySelector('input[name="tipMode"]:checked')?.value || "none";
  const rawValue = Math.max(0, Number(box.querySelector("[data-tip-value]")?.value) || 0);
  const amount = mode === "fixed" ? rawValue : mode === "percent" ? subtotal * (rawValue / 100) : 0;
  const paymentMethod =
    form.querySelector?.('input[name="tipPaymentMethod"]:checked')?.value
    || document.querySelector('input[name="tipPaymentMethod"]:checked')?.value
    || "Efectivo";
  return {
    mode,
    value: rawValue,
    amount: roundCurrency(amount),
    paymentMethod,
  };
}

function readCheckoutPayment(order, form = document.querySelector("[data-checkout-form]")) {
  if (!order || !form) return null;
  const totals = calculateTotals(order);
  const subtotal = totals.subtotal;
  const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value || state.paymentMethod || "Efectivo";
  const tip = readCheckoutTip(subtotal, form);
  tip.paymentMethod = form.querySelector('input[name="tipPaymentMethod"]:checked')?.value || paymentMethod;
  const cashDue = roundCurrency(
    (paymentBucket(paymentMethod) === "cash" ? subtotal : 0)
    + (paymentBucket(tip.paymentMethod) === "cash" ? tip.amount : 0),
  );
  const cardDue = roundCurrency(
    (paymentBucket(paymentMethod) === "card" ? subtotal : 0)
    + (paymentBucket(tip.paymentMethod) === "card" ? tip.amount : 0),
  );
  const cashReceived = cashDue > 0
    ? roundCurrency(Math.max(0, Number(form.querySelector("[data-cash-received]")?.value) || 0))
    : 0;
  return {
    paymentMethod,
    tip,
    subtotal,
    netSubtotal: totals.netSubtotal,
    taxableSubtotal: totals.netSubtotal,
    iva: totals.iva,
    taxAmount: totals.iva,
    ivaEnabled: totals.ivaEnabled,
    taxEnabled: totals.ivaEnabled,
    ivaRate: totals.ivaRate,
    taxRate: totals.ivaRate,
    total: roundCurrency(subtotal + tip.amount),
    cashDue,
    cardDue,
    cashReceived,
    changeGiven: cashDue > 0 ? roundCurrency(Math.max(0, cashReceived - cashDue)) : 0,
  };
}

function shouldKeepManualCashReceived(event, form, payment) {
  const cashInput = form.querySelector("[data-cash-received]");
  if (!cashInput) return false;
  if (event?.target === cashInput) {
    cashInput.dataset.cashManual = "true";
    return true;
  }
  if (payment.cashDue <= 0) return true;
  if (cashInput.dataset.cashManual === "true") return true;
  const current = Number(cashInput.value);
  const previousAuto = Number(cashInput.dataset.autoCashDue);
  if (Number.isFinite(current) && Number.isFinite(previousAuto) && roundCurrency(current) !== roundCurrency(previousAuto)) {
    cashInput.dataset.cashManual = "true";
    return true;
  }
  return false;
}

function updateCheckoutPaymentPreview(event) {
  const form = event?.currentTarget?.matches?.("[data-checkout-form]")
    ? event.currentTarget
    : document.querySelector("[data-checkout-form]");
  if (!form) return;
  if (event?.target?.name === "paymentMethod") {
    form.querySelectorAll('input[name="tipPaymentMethod"]').forEach((input) => {
      input.checked = input.value === event.target.value;
    });
  }
  const order = getOrder(form.dataset.orderId) || getActiveOrder();
  let payment = readCheckoutPayment(order, form);
  if (!payment) return;
  const cashInput = form.querySelector("[data-cash-received]");
  const keepManualCash = shouldKeepManualCashReceived(event, form, payment);
  if (payment.cashDue > 0 && cashInput && !keepManualCash) {
    cashInput.value = payment.cashDue.toFixed(2);
    cashInput.dataset.autoCashDue = payment.cashDue.toFixed(2);
    payment = readCheckoutPayment(order, form);
  }
  form.querySelector("[data-checkout-total]").textContent = money.format(payment.total);
  form.querySelector("[data-tip-preview]").textContent = money.format(payment.tip.amount);
  form.querySelector("[data-payment-preview]").textContent = payment.paymentMethod;
  const cashFields = form.querySelector("[data-cash-fields]");
  cashFields?.classList.toggle("is-hidden", payment.cashDue <= 0);
  const cashDue = form.querySelector("[data-cash-due]");
  const cashTip = form.querySelector("[data-cash-tip]");
  const cashChange = form.querySelector("[data-cash-change]");
  if (cashDue) cashDue.textContent = money.format(payment.cashDue);
  if (cashTip) cashTip.textContent = `${money.format(payment.tip.amount)} ${payment.tip.amount ? `(${payment.tip.paymentMethod})` : ""}`.trim();
  if (cashChange) {
    const short = payment.cashDue > 0 && payment.cashReceived < payment.cashDue;
    cashChange.textContent = short
      ? `Falta ${money.format(payment.cashDue - payment.cashReceived)}`
      : money.format(payment.changeGiven);
    cashChange.classList.toggle("is-short", short);
  }
}

function confirmCheckoutPayment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const order = state.orders.find((item) => item.id === form.dataset.orderId && item.status === "open");
  const payment = readCheckoutPayment(order, form);
  if (!order || !payment) return;
  if (!currentCashSession()) {
    showToast("Abre caja antes de cobrar efectivo o tarjeta.");
    return;
  }
  if (payment.cashDue > 0 && payment.cashReceived < payment.cashDue) {
    showToast(`Faltan ${money.format(payment.cashDue - payment.cashReceived)} en efectivo.`);
    return;
  }
  const pending = order.items.some((item) => item.status === "pending");
  const details = [
    `Total: ${money.format(payment.total)}`,
    `Subtotal s/IVA: ${money.format(payment.netSubtotal)}`,
    `${ivaLabel(payment.ivaRate)}: ${money.format(payment.iva)}`,
    `Pago principal: ${payment.paymentMethod}`,
    payment.cardDue > 0 ? `A tarjeta: ${money.format(payment.cardDue)}` : "",
    payment.cashDue > 0 ? `A efectivo: ${money.format(payment.cashDue)}` : "",
    payment.cashDue > 0 ? `Recibido: ${money.format(payment.cashReceived)}` : "",
    payment.cashDue > 0 ? `Cambio: ${money.format(payment.changeGiven)}` : "",
    payment.tip.amount > 0
      ? `Propina: ${money.format(payment.tip.amount)} (${payment.tip.paymentMethod})`
      : "Propina: sin propina",
    pending ? "Aviso: hay productos sin comandar." : "",
  ].filter(Boolean);
  const confirmed = window.confirm(`Confirmar cierre de ${orderLabel(order)}?\n\n${details.join("\n")}`);
  if (!confirmed) return;
  chargeOrder(order.id, { ...payment, confirmed: true }, event.submitter || form);
}

function normalizeCheckoutPayment(order, payment, baseTotals = calculateTotals(order)) {
  if (payment && typeof payment === "object") {
    const tax = taxBreakdownForGross(payment.subtotal ?? baseTotals.subtotal, payment.ivaRate ?? payment.taxRate ?? baseTotals.ivaRate);
    const tip = {
      mode: payment.tip?.mode || "none",
      value: Number(payment.tip?.value) || 0,
      amount: roundCurrency(payment.tip?.amount),
      paymentMethod: payment.tip?.paymentMethod || payment.paymentMethod || "Efectivo",
    };
    return {
      ...payment,
      paymentMethod: payment.paymentMethod || "Efectivo",
      tip,
      subtotal: roundCurrency(payment.subtotal ?? baseTotals.subtotal),
      netSubtotal: roundCurrency(payment.netSubtotal ?? payment.taxableSubtotal ?? tax.netSubtotal),
      taxableSubtotal: roundCurrency(payment.taxableSubtotal ?? payment.netSubtotal ?? tax.netSubtotal),
      iva: roundCurrency(payment.iva ?? payment.taxAmount ?? tax.iva),
      taxAmount: roundCurrency(payment.taxAmount ?? payment.iva ?? tax.iva),
      ivaEnabled: Boolean(payment.ivaEnabled ?? payment.taxEnabled ?? baseTotals.ivaEnabled),
      taxEnabled: Boolean(payment.taxEnabled ?? payment.ivaEnabled ?? baseTotals.ivaEnabled),
      ivaRate: cleanIvaRate(payment.ivaRate ?? payment.taxRate ?? tax.ivaRate),
      taxRate: cleanIvaRate(payment.taxRate ?? payment.ivaRate ?? tax.ivaRate),
      total: roundCurrency(payment.total ?? baseTotals.subtotal + tip.amount),
      cashDue: roundCurrency(payment.cashDue),
      cardDue: roundCurrency(payment.cardDue),
      cashReceived: roundCurrency(payment.cashReceived),
      changeGiven: roundCurrency(payment.changeGiven),
    };
  }
  const paymentMethod = typeof payment === "string" ? payment : state.paymentMethod || "Efectivo";
  const tip = readCheckoutTip(baseTotals.subtotal);
  tip.paymentMethod = tip.paymentMethod || paymentMethod;
  const cashDue = roundCurrency(
    (paymentBucket(paymentMethod) === "cash" ? baseTotals.subtotal : 0)
    + (paymentBucket(tip.paymentMethod) === "cash" ? tip.amount : 0),
  );
  const cardDue = roundCurrency(baseTotals.subtotal + tip.amount - cashDue);
  return {
    paymentMethod,
    tip,
    subtotal: baseTotals.subtotal,
    netSubtotal: baseTotals.netSubtotal,
    taxableSubtotal: baseTotals.netSubtotal,
    iva: baseTotals.iva,
    taxAmount: baseTotals.iva,
    ivaEnabled: baseTotals.ivaEnabled,
    taxEnabled: baseTotals.ivaEnabled,
    ivaRate: baseTotals.ivaRate,
    taxRate: baseTotals.ivaRate,
    total: roundCurrency(baseTotals.subtotal + tip.amount),
    cashDue,
    cardDue,
    cashReceived: cashDue,
    changeGiven: 0,
  };
}

function chargeOrder(orderId, payment = "Efectivo", source) {
  const order = state.orders.find((item) => item.id === orderId && item.status === "open");
  if (!order) return;
  const baseTotals = calculateTotals(order);
  const checkout = normalizeCheckoutPayment(order, payment, baseTotals);
  const paymentMethod = checkout.paymentMethod;
  const orderNumber = ensureOrderNumber(order);
  if (!order.items.length) {
    const closedDate = new Date();
    const closedAt = closedDate.toISOString();
    const paymentUid = createPaymentUid(closedDate);
    order.status = "closed";
    order.closedAt = closedAt;
    order.closedBy = currentUser().id;
    order.cashierId = currentUser().id;
    order.paymentMethod = paymentMethod;
    order.paymentUid = paymentUid;
    order.payment = {
      uid: paymentUid,
      method: paymentMethod,
      cashDue: checkout.cashDue,
      cardDue: checkout.cardDue,
      cashReceived: checkout.cashReceived,
      changeGiven: checkout.changeGiven,
      subtotal: checkout.subtotal,
      netSubtotal: checkout.netSubtotal,
      taxableSubtotal: checkout.netSubtotal,
      iva: checkout.iva,
      taxAmount: checkout.iva,
      ivaEnabled: checkout.ivaEnabled,
      taxEnabled: checkout.ivaEnabled,
      ivaRate: checkout.ivaRate,
      taxRate: checkout.ivaRate,
      confirmedAt: closedAt,
      confirmedBy: currentUser().id,
    };
    order.tip = checkout.tip;
    if (state.activeOrderId === order.id) state.activeOrderId = null;
    state.modal = null;
    persist();
    render();
    return;
  }
  const cashSession = currentCashSession();
  if (!cashSession) {
    showToast("Abre caja antes de cobrar efectivo o tarjeta.");
    return;
  }
  const pending = order.items.some((item) => item.status === "pending");
  if (pending && !checkout.confirmed) {
    const confirmed = window.confirm("Hay productos sin comandar. Cerrar de todos modos?");
    if (!confirmed) return;
  }
  const closedDate = new Date();
  const closedAt = closedDate.toISOString();
  const paymentUid = createPaymentUid(closedDate);
  const paymentRecord = {
    uid: paymentUid,
    method: paymentMethod,
    cashDue: checkout.cashDue,
    cardDue: checkout.cardDue,
    cashReceived: checkout.cashReceived,
    changeGiven: checkout.changeGiven,
    subtotal: checkout.subtotal,
    netSubtotal: checkout.netSubtotal,
    taxableSubtotal: checkout.netSubtotal,
    iva: checkout.iva,
    taxAmount: checkout.iva,
    ivaEnabled: checkout.ivaEnabled,
    taxEnabled: checkout.ivaEnabled,
    ivaRate: checkout.ivaRate,
    taxRate: checkout.ivaRate,
    confirmedAt: closedAt,
    confirmedBy: currentUser().id,
  };
  const totals = {
    ...baseTotals,
    tip: checkout.tip.amount,
    tipMode: checkout.tip.mode,
    tipValue: checkout.tip.value,
    tipPaymentMethod: checkout.tip.paymentMethod,
    netSubtotal: checkout.netSubtotal,
    taxableSubtotal: checkout.netSubtotal,
    iva: checkout.iva,
    taxAmount: checkout.iva,
    ivaEnabled: checkout.ivaEnabled,
    taxEnabled: checkout.ivaEnabled,
    ivaRate: checkout.ivaRate,
    taxRate: checkout.ivaRate,
    total: checkout.total,
  };
  const saleRecord = {
    id: safeId("sale"),
    uid: paymentUid,
    paymentUid,
    orderId: order.id,
    orderNumber,
    dailyOrderNumber: orderDailyNumber(order, closedAt),
    type: order.type,
    tableNumber: order.tableNumber,
    label: orderLabel(order),
    customerName: order.customerName,
    comments: order.comments,
    waiterId: order.waiterId,
    cashierId: currentUser().id,
    paymentMethod,
    payment: paymentRecord,
    cashSessionId: cashSession.id,
    items: structuredClone(order.items),
    commandBatches: structuredClone(order.commandBatches),
    totals,
    tip: checkout.tip,
    openedAt: order.openedAt,
    closedAt,
    chargedAt: closedAt,
    waitMinutes: minutesBetween(order.openedAt, closedAt),
    prepaidReceiptPrintedAt: order.prepaidReceiptPrintedAt || "",
    prepaidReceiptPrintedBy: order.prepaidReceiptPrintedBy || "",
    prepaidReceiptMethod: order.prepaidReceiptMethod || "",
    prepaidReceiptError: order.prepaidReceiptError || "",
    prepaidReceiptFailedAt: order.prepaidReceiptFailedAt || "",
    postpaidReceiptPrintedAt: "",
    postpaidReceiptPrintedBy: "",
    postpaidReceiptWarningDismissedAt: "",
    postpaidReceiptWarningDismissedBy: "",
    postpaidReceiptError: "",
  };
  state.sales.unshift(saleRecord);
  order.status = "closed";
  order.closedAt = closedAt;
  order.cashierId = currentUser().id;
  order.paymentMethod = paymentMethod;
  order.paymentUid = paymentUid;
  order.payment = paymentRecord;
  order.tip = checkout.tip;
  state.paymentMethod = paymentMethod;
  if (state.activeOrderId === order.id) state.activeOrderId = null;
  state.productConfig = null;
  state.modal = null;
  persist();
  showToast(`${orderLabel(order)} cobrada por ${money.format(totals.total)}.`);
  celebrateAction("paid", source, "Cobrado");
  render();
  void printClosedSaleReceipt(saleRecord);
}

function saveSaleTip(event) {
  event.preventDefault();
  const sale = state.sales.find((item) => item.id === event.currentTarget.dataset.saleId);
  if (!sale) return;
  if (!canAdjustSaleTip(sale)) {
    showToast("La propina solo puede ajustarse antes del corte de caja.");
    state.modal = null;
    persist();
    render();
    return;
  }
  const form = new FormData(event.currentTarget);
  const amount = roundCurrency(Math.max(0, Number(form.get("tipAmount")) || 0));
  const paymentMethod = String(form.get("tipPaymentMethod") || sale.paymentMethod || "Efectivo");
  const subtotal = saleSubtotal(sale);
  const tax = saleTaxBreakdown(sale);
  const now = new Date().toISOString();
  sale.tip = {
    ...(sale.tip || {}),
    mode: "fixed",
    value: amount,
    amount,
    paymentMethod,
    adjustedAt: now,
    adjustedBy: currentUser().id,
  };
  sale.totals = {
    ...(sale.totals || {}),
    subtotal,
    netSubtotal: tax.netSubtotal,
    taxableSubtotal: tax.netSubtotal,
    iva: tax.iva,
    taxAmount: tax.iva,
    ivaRate: tax.ivaRate,
    taxRate: tax.ivaRate,
    tip: amount,
    tipMode: "fixed",
    tipValue: amount,
    tipPaymentMethod: paymentMethod,
    total: roundCurrency(subtotal + amount),
  };
  sale.total = sale.totals.total;
  sale.tipAdjustedAt = now;
  sale.tipAdjustedBy = currentUser().id;
  state.modal = null;
  persist();
  showToast(`Propina actualizada a ${money.format(amount)} en ${paymentMethod}.`);
  render();
}

function cancelOrderFromForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const note = String(form.get("note") || "").trim();
  if (!note) {
    showToast("Captura una nota para cancelar la orden.");
    return;
  }
  cancelOrder(event.currentTarget.dataset.orderId, note);
}

function cancelOrder(orderId, note) {
  const order = state.orders.find((item) => item.id === orderId && item.status === "open");
  if (!order) return;
  const now = new Date().toISOString();
  const totals = calculateTotals(order);
  const restorableLines = [];
  (order.commandBatches || []).forEach((batch) => {
    const status = batch.status || "new";
    if (status === "new") {
      (batch.lines || []).forEach((batchLine) => {
        const line = order.items.find((item) => item.id === batchLine.lineId);
        if (line) restorableLines.push({ ...line, qty: batchLine.qty });
      });
    }
    if (status !== "delivered") {
      batch.status = "cancelled";
      batch.cancelledAt = now;
      batch.updatedAt = now;
      batch.updatedBy = currentUser().id;
    }
  });
  if (restorableLines.length) {
    restoreInventoryForLines(restorableLines, order, "Cancelacion de orden antes de cocina");
  }
  recordCancellation({
    scope: "order",
    source: order.type === "table" ? "Mesa" : "Venta",
    stage: "order",
    orderId: order.id,
    orderLabel: orderLabel(order),
    tableNumber: order.tableNumber,
    waiterId: order.waiterId,
    qty: totals.count,
    amount: totals.total,
    note,
    items: order.items.map((item) => ({
      lineId: item.id,
      productId: item.productId,
      name: item.name,
      qty: item.qty,
      amount: item.unitPrice * item.qty,
    })),
    restoredStock: restorableLines.length > 0,
  });
  order.status = "cancelled";
  order.cancelledAt = now;
  order.cancelledBy = currentUser().id;
  order.cancelReason = note;
  if (state.activeOrderId === order.id) state.activeOrderId = null;
  state.productConfig = null;
  state.modal = null;
  persist();
  showToast(`${orderLabel(order)} cancelada como incidencia.`);
  render();
}

function cancelLineFromForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  cancelLine({
    orderId: event.currentTarget.dataset.orderId,
    lineId: event.currentTarget.dataset.lineId,
    commandId: event.currentTarget.dataset.commandId,
    source: event.currentTarget.dataset.cancelSource || "venta",
    qty: Number(form.get("qty")) || 1,
    note: String(form.get("note") || "").trim(),
  });
}

function cancelLine({ orderId, lineId, commandId, source = "venta", qty = 1, note = "" }) {
  const order = getOrder(orderId);
  const line = order?.items.find((item) => item.id === lineId);
  if (!order || !line) return;
  const batch = findBatchForLine(order, line.id, commandId, source === "venta" ? ["new"] : ["new", "preparing", "ready"]);
  const batchLine = batch?.lines?.find((item) => item.lineId === line.id);
  const stage = batch?.status || lineServiceStatus(line, order);
  const serviceStatus = lineServiceStatus(line, order);
  const allowed =
    source === "venta" ? stage === "new" || serviceStatus === "waiting" : ["new", "preparing", "ready"].includes(stage);
  if (!allowed) {
    showToast("Esa linea ya no se puede cancelar desde aqui.");
    state.modal = null;
    persist();
    render();
    return;
  }
  const maxQty = Math.max(0, Math.min(line.qty, batchLine?.qty ?? line.qty));
  const cancelQty = Math.min(Math.max(1, qty), maxQty);
  if (!cancelQty) return;
  const now = new Date().toISOString();
  const amount = line.unitPrice * cancelQty;
  const restoreStock = stage === "new" || stage === "waiting";
  if (restoreStock) {
    restoreInventoryForLines([{ ...line, qty: cancelQty }], order, `Cancelacion ${line.name} antes de cocina`);
  }
  if (batchLine) {
    batchLine.qty -= cancelQty;
    if (batchLine.qty <= 0) batch.lines = batch.lines.filter((item) => item.lineId !== line.id);
    batch.updatedAt = now;
    batch.updatedBy = currentUser().id;
    if (!batch.lines.length) {
      batch.status = "cancelled";
      batch.cancelledAt = now;
    }
  }
  line.qty -= cancelQty;
  if (line.qty <= 0) {
    order.items = order.items.filter((item) => item.id !== line.id);
  }
  const sourceLabel = source === "cocina" ? "Cocina" : "Venta";
  recordCancellation({
    scope: "item",
    source: sourceLabel,
    stage,
    orderId: order.id,
    orderLabel: orderLabel(order),
    tableNumber: order.tableNumber,
    waiterId: order.waiterId,
    lineId: line.id,
    productId: line.productId,
    itemName: line.name,
    qty: cancelQty,
    amount,
    note,
    restoredStock: restoreStock,
  });
  if (source === "cocina") {
    const message = `${cancelQty} x ${line.name} cancelado en cocina (${cancellationStageLabel(stage)}).${note ? ` ${note}` : ""}`;
    addOrderAlert(order, message, "cancel");
  }
  state.modal = null;
  persist();
  showToast(`${cancelQty} x ${line.name} cancelado.`);
  render();
}

function clearOrderAlert(key) {
  const [orderId, alertId] = String(key || "").split(":");
  const order = getOrder(orderId);
  const alert = order?.alerts?.find((item) => item.id === alertId);
  if (!alert) return;
  alert.clearedAt = new Date().toISOString();
  alert.clearedBy = currentUser().id;
  persist();
  render();
}

function startProductConfig(productId) {
  if (!isCashOpen()) {
    showToast("Abre caja antes de agregar productos.");
    return;
  }
  const product = getProduct(productId);
  if (!product) return;
  if (product.active === false) {
    showToast("Este articulo esta desactivado.");
    return;
  }
  const selections = defaultSelectionsFor(product);
  if (!productHasAvailableSelections(product, selections)) {
    showToast("Este articulo no tiene variantes activas para vender.");
    return;
  }
  state.productConfig = { productId, qty: 1, selections, note: "", extras: [], parts: null };
  state.modal = null;
  persist();
  render();
}

// Construye el set inicial de "parts" cuando el usuario activa Mixto.
// Cada parte hereda las selecciones actuales de las opciones divisibles
// para que el cambio sea reversible sin perder elecciones.
function buildInitialSplitParts(product, baseSelections, count) {
  const splittables = splittableOptions(product);
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const partSelections = {};
    splittables.forEach((option) => {
      const fromBase = baseSelections?.[option.id];
      partSelections[option.id] = Number.isInteger(fromBase) ? fromBase : firstActiveChoiceIndex(option);
    });
    parts.push({ selections: partSelections });
  }
  return parts;
}

function toggleSplitMode(enabled) {
  if (!state.productConfig) return;
  const product = getProduct(state.productConfig.productId);
  if (!product || !productIsSplittable(product)) return;
  if (enabled) {
    const baseSelections = { ...(state.productConfig.selections || {}) };
    const splittables = splittableOptions(product);
    const parts = buildInitialSplitParts(product, baseSelections, 2);
    // Quitamos las opciones divisibles de las comunes (ahora viven en parts).
    splittables.forEach((option) => {
      delete baseSelections[option.id];
    });
    state.productConfig.selections = baseSelections;
    state.productConfig.parts = parts;
  } else {
    // Al desactivar, recuperamos las selecciones de la primera parte como comunes.
    const firstPart = state.productConfig.parts?.[0]?.selections || {};
    state.productConfig.selections = {
      ...(state.productConfig.selections || {}),
      ...firstPart,
    };
    state.productConfig.parts = null;
  }
  persist();
  refreshProductConfig();
}

function setSplitPartsCount(target) {
  if (!state.productConfig || !Array.isArray(state.productConfig.parts)) return;
  const product = getProduct(state.productConfig.productId);
  if (!product) return;
  const max = splitMaxParts(product);
  const next = Math.max(2, Math.min(Number(target) || 2, max));
  const current = state.productConfig.parts;
  if (current.length === next) return;
  if (next > current.length) {
    // Agregar partes nuevas heredando la última como base sensata.
    const lastSelections = current[current.length - 1]?.selections || {};
    while (state.productConfig.parts.length < next) {
      state.productConfig.parts.push({ selections: { ...lastSelections } });
    }
  } else {
    state.productConfig.parts = current.slice(0, next);
  }
  persist();
  refreshProductConfig();
}

function closeProductConfig() {
  state.productConfig = null;
  state.modal = null;
  persist();
  render();
}

// Abre el modal de configuración con los datos actuales de la línea para
// permitir editarla mientras la comanda no haya entrado a preparación.
function startEditLineConfig(lineId) {
  const order = getActiveOrder();
  if (!order) return;
  const line = order.items.find((item) => item.id === lineId);
  if (!line) return;
  if (!lineIsEditable(order, line)) {
    showToast("La cocina ya empezó a preparar esta línea. Ya no se puede editar.");
    return;
  }
  state.productConfig = {
    productId: line.productId,
    qty: line.qty,
    selections: structuredClone(line.selections || {}),
    parts: lineParts(line) ? structuredClone(line.parts) : null,
    extras: structuredClone(line.extras || []),
    note: line.note || "",
    editingLineId: line.id,
  };
  state.modal = null;
  persist();
  render();
}

function addProductExtra() {
  if (!state.productConfig) return;
  const extraId = document.querySelector("[data-extra-id]")?.value;
  const definition = getExtraDefinition(extraId);
  const item = extraInventoryItem(definition);
  if (!definition || definition.active === false) {
    showToast("Selecciona un extra activo.");
    return;
  }
  if (!item || Number(definition.qty) <= 0) {
    showToast("Este extra necesita un insumo de inventario y gramaje valido.");
    return;
  }
  const extras = normalizeExtras(state.productConfig.extras);
  const existing = extras.find((extra) => extra.extraId === definition.id || normalize(extra.name) === normalize(definition.name));
  if (existing) {
    existing.count += 1;
    existing.qty += Number(definition.qty) || 0;
    existing.price = roundCurrency(existing.price + (Number(definition.price) || 0));
    existing.itemId = item.id;
    existing.inventoryItemName = item.name;
    existing.unit = item.unit;
    existing.unitCost = Number(item.unitCost) || existing.unitCost;
    existing.costTotal = roundCurrency(existing.qty * existing.unitCost);
    existing.total = existing.price;
  } else {
    extras.push({
      extraId: definition.id,
      itemId: item.id,
      name: definition.name,
      inventoryItemName: item.name,
      unit: item.unit,
      qty: Number(definition.qty) || 0,
      count: 1,
      price: Number(definition.price) || 0,
      unitCost: Number(item.unitCost) || 0,
      costTotal: roundCurrency((Number(definition.qty) || 0) * (Number(item.unitCost) || 0)),
      total: Number(definition.price) || 0,
    });
  }
  state.productConfig.extras = extras;
  persist();
  if ((Number(item.qty) || 0) <= 0) showToast("Aviso: el insumo vinculado al extra esta en cero.");
  refreshProductConfig();
}

function removeProductExtra(index) {
  if (!state.productConfig) return;
  const extras = normalizeExtras(state.productConfig.extras);
  if (!extras[index]) return;
  extras.splice(index, 1);
  state.productConfig.extras = extras;
  persist();
  refreshProductConfig();
}

function toggleMultiOption(optionId, index) {
  const current = state.productConfig.selections[optionId] || [];
  state.productConfig.selections[optionId] = current.includes(index)
    ? current.filter((item) => item !== index)
    : [...current, index];
  persist();
  applySelectionUpdateInPlace();
}

function updateConfigQty(delta) {
  if (!state.productConfig) return;
  state.productConfig.qty = Math.max(1, state.productConfig.qty + delta);
  persist();
  const product = getProduct(state.productConfig.productId);
  if (!product) return;
  const unitPrice = configuredUnitPrice(product, state.productConfig.selections, state.productConfig.extras);
  const order = getActiveOrder();
  const stock = estimateProductStock(product, state.productConfig.selections, state.productConfig.extras);
  const qtyTarget = document.querySelector("[data-config-qty-value]");
  const totalTarget = document.querySelector("[data-config-total]");
  const unitTarget = document.querySelector("[data-config-unit]");
  const taxTarget = document.querySelector("[data-config-tax]");
  const stockTarget = document.querySelector("[data-config-stock-panel]");
  const stockPanel = document.querySelector("[data-stock-panel]");
  const stockMessage = document.querySelector("[data-stock-message]");
  if (qtyTarget) qtyTarget.textContent = String(state.productConfig.qty);
  if (totalTarget) totalTarget.textContent = money.format(unitPrice * state.productConfig.qty);
  if (unitTarget) unitTarget.textContent = `${money.format(unitPrice)} c/u`;
  if (taxTarget) {
    const total = unitPrice * state.productConfig.qty;
    const tax = order ? taxBreakdownForOrder(order, total) : taxBreakdownForGross(total);
    taxTarget.textContent = `Incluye ${ivaLabel(tax.ivaRate)} ${money.format(tax.iva)}`;
  }
  if (stockPanel && stockMessage) {
    const overRequest = stock.known && state.productConfig.qty > stock.orderable;
    stockPanel.className = `stock-panel ${stock.known ? stock.tone : "unknown"} ${overRequest ? "over-request" : ""}`;
    stockMessage.textContent = productStockMessage(stock, state.productConfig.qty);
    return;
  }
  if (stockTarget) stockTarget.innerHTML = renderProductStockPanel(stock, state.productConfig.qty);
}

function addConfiguredProduct() {
  if (!isCashOpen()) {
    showToast("Abre caja antes de agregar productos.");
    state.productConfig = null;
    persist();
    render();
    return;
  }
  const order = getActiveOrder();
  const product = getProduct(state.productConfig?.productId);
  if (!order || !product) return;
  if (product.active === false) {
    showToast("Este articulo esta desactivado.");
    state.productConfig = null;
    persist();
    render();
    return;
  }
  const selections = structuredClone(state.productConfig.selections || {});
  const rawParts = Array.isArray(state.productConfig.parts) && state.productConfig.parts.length >= 2
    ? structuredClone(state.productConfig.parts)
    : null;
  const lineDraft = { productId: product.id, selections, parts: rawParts };
  if (!lineHasAvailableParts(product, lineDraft)) {
    showToast("Selecciona una variante activa en todas las partes.");
    state.productConfig = null;
    persist();
    render();
    return;
  }
  const extras = normalizeExtras(state.productConfig.extras);
  const unitPrice = combinedUnitPrice(product, lineDraft, extras);
  const costSnapshot = productCostSnapshot(product, selections, extras, rawParts);
  const optionsText = combinedOptionSummary(product, lineDraft, extras);
  const optionKey = JSON.stringify({ selections, extras, parts: rawParts });
  const note = String(state.productConfig.note || "").trim();
  const requestedQty = state.productConfig.qty;
  const stock = estimateProductStock(product, selections, extras, rawParts);
  // ====== Modo edición: actualizar línea existente y notificar a cocina ======
  if (state.productConfig.editingLineId) {
    const editingId = state.productConfig.editingLineId;
    const existingLine = order.items.find((item) => item.id === editingId);
    if (!existingLine) {
      showToast("La linea ya no existe.");
      state.productConfig = null;
      persist();
      render();
      return;
    }
    if (!lineIsEditable(order, existingLine)) {
      showToast("La cocina ya empezó a preparar esta línea.");
      state.productConfig = null;
      persist();
      render();
      return;
    }
    // Devolver al inventario lo que descontaba la versión vieja y descontar
    // lo nuevo. Si la línea aún era pending no había consumo; en ese caso
    // el restore es 0 (inventoryUsageForLine devuelve 0 para items pending).
    const hadDeducted = existingLine.status !== "pending";
    if (hadDeducted) {
      restoreInventoryForLines([existingLine], order, "Edición de orden");
    }
    Object.assign(existingLine, {
      qty: state.productConfig.qty,
      unitPrice,
      selections,
      parts: rawParts,
      extras,
      costSnapshot,
      unitCostSnapshot: costSnapshot.total,
      optionKey,
      optionsText,
      note,
      editedAt: new Date().toISOString(),
      editedBy: currentUser()?.id || "",
    });
    if (hadDeducted) {
      deductInventoryForLines([existingLine], order);
    }
    // Sincronizar el batch que contiene esta línea (si está en cocina)
    const batch = findBatchContainingLine(order, existingLine.id);
    if (batch) {
      const batchLine = (batch.lines || []).find((bl) => bl.lineId === existingLine.id);
      if (batchLine) {
        Object.assign(batchLine, {
          name: existingLine.name,
          qty: existingLine.qty,
          selections: existingLine.selections,
          parts: lineParts(existingLine) ? structuredClone(existingLine.parts) : null,
          optionsText: existingLine.optionsText,
          note: existingLine.note,
        });
      }
      batch.editedAt = new Date().toISOString();
      batch.editedBy = currentUser()?.id || "";
      batch.hasEdits = true;
    }
    state.productConfig = null;
    state.modal = null;
    persist();
    showToast(batch ? "Orden actualizada. Cocina verá el cambio." : "Línea actualizada.");
    render();
    return;
  }
  // ====== Flujo normal: nueva línea pending ======
  const existing = order.items.find(
    (item) =>
      item.status === "pending" &&
      item.productId === product.id &&
      item.optionKey === optionKey &&
      (item.note || "") === note &&
      roundCurrency(Number(item.costSnapshot?.total ?? item.unitCostSnapshot) || 0) === costSnapshot.total,
  );
  if (existing) {
    existing.qty += state.productConfig.qty;
  } else {
    order.items.push({
      id: safeId("line"),
      productId: product.id,
      name: product.name,
      section: product.section,
      subsection: product.subsection,
      station: product.station,
      qty: state.productConfig.qty,
      unitPrice,
      selections,
      parts: rawParts,
      extras,
      costSnapshot,
      unitCostSnapshot: costSnapshot.total,
      optionKey,
      optionsText,
      note,
      status: "pending",
      addedBy: currentUser().id,
      addedAt: new Date().toISOString(),
      commandIds: [],
    });
  }
  state.productConfig = null;
  state.modal = null;
  persist();
  if (stock.known && requestedQty > stock.orderable) {
    showToast(`Inventario bajo: quedan aprox. ${stock.orderable} ordenes de ${product.name}.`);
  }
  render();
}

function configuredUnitPrice(product, selections, extras = []) {
  let price = Number(product.price) || 0;
  product.options.forEach((option) => {
    const selected = selections[option.id];
    if (option.type === "single") {
      const choice = option.choices[selected];
      if (!choice) return;
      if (Number.isFinite(choice.price)) price = Number(choice.price);
      if (Number.isFinite(choice.priceDelta)) price += Number(choice.priceDelta);
      return;
    }
    if (option.type === "multi" && Array.isArray(selected)) {
      selected.forEach((index) => {
        const choice = option.choices[index];
        if (choice?.priceDelta) price += Number(choice.priceDelta);
      });
    }
  });
  price += extraUnitTotal(extras);
  return price;
}

function optionSummary(product, selections, extras = []) {
  const parts = [];
  product.options.forEach((option) => {
    const selected = selections[option.id];
    if (option.type === "single") {
      const choice = option.choices[selected];
      if (choice) parts.push(`${option.label}: ${choice.label}`);
    }
    if (option.type === "multi" && Array.isArray(selected) && selected.length) {
      const labels = selected.map((index) => option.choices[index]?.label).filter(Boolean);
      if (labels.length) parts.push(`${option.label}: ${labels.join(", ")}`);
    }
  });
  const extraParts = normalizeExtras(extras).map(
    (extra) => `${extra.name}${extra.count > 1 ? ` x${formatNumber(extra.count)}` : ""} (+${money.format(extra.total)})`,
  );
  if (extraParts.length) parts.push(`Extras: ${extraParts.join(", ")}`);
  return parts.join(" · ");
}

function updateLineQty(lineId, delta) {
  const order = getActiveOrder();
  if (!order) return;
  const line = order.items.find((item) => item.id === lineId && item.status === "pending");
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) {
    order.items = order.items.filter((item) => item.id !== lineId);
  }
  persist();
  render();
}

function removeLine(lineId) {
  const order = getActiveOrder();
  if (!order) return;
  order.items = order.items.filter((item) => item.id !== lineId || item.status === "commanded");
  persist();
  render();
}

function commandPending(mode, source) {
  const order = getActiveOrder();
  if (!order) return;
  if (!isCashOpen()) {
    showToast("Abre caja antes de comandar productos.");
    state.modal = null;
    persist();
    render();
    return;
  }
  const pending = order.items.filter((item) => item.status === "pending");
  if (!pending.length) {
    showToast("No hay productos pendientes para comandar.");
    return;
  }
  const shouldPrint = mode === "digital-print";
  if (mode !== "digital" && !shouldPrint) {
    showToast("Por ahora solo esta activa la comanda digital.");
    return;
  }
  deductInventoryForLines(pending, order);
  const batchId = safeId("cmd");
  const batch = {
    id: batchId,
    mode: shouldPrint ? "digital-print" : "digital",
    status: "new",
    createdAt: new Date().toISOString(),
    createdBy: currentUser().id,
    lines: pending.map((item) => ({
      lineId: item.id,
      productId: item.productId,
      name: item.name,
      qty: item.qty,
      station: item.station,
      selections: item.selections || {},
      // Replicamos parts en el batch para que cocina pueda mostrar el desglose
      // visual del platillo mixto sin depender solo del texto.
      parts: lineParts(item) ? structuredClone(item.parts) : null,
      optionsText: item.optionsText,
      note: item.note || "",
    })),
  };
  pending.forEach((item) => {
    item.status = "commanded";
    item.commandIds.push(batchId);
  });
  order.commandBatches.push(batch);
  state.modal = null;
  persist();
  showToast(`Comanda ${shouldPrint ? "digital + impresa" : "digital"} enviada para ${orderLabel(order)}.`);
  celebrateAction("kitchen", source, "A cocina");
  render();
  if (shouldPrint) {
    void printCommandBatch(order.id, batch.id, { force: true });
  }
}

function finalizeOrder(source) {
  const order = getActiveOrder();
  if (!order) return;
  openCheckout(order.id);
}

function createUser(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede crear usuarios.");
    return;
  }
  const form = new FormData(event.currentTarget);
  const username = cleanUserText(form.get("username"));
  const name = cleanUserText(form.get("name"));
  const password = String(form.get("password") || "").trim();
  const functions = form.getAll("functions").map(String);
  if (!username || !name) {
    showToast("Captura nombre y usuario.");
    return;
  }
  if (!password) {
    showToast("La contrasena no puede estar vacia.");
    return;
  }
  if (state.users.some((user) => user.active && sameUsername(user.username, username))) {
    showToast("Ese usuario ya existe.");
    return;
  }
  if (!functions.length) {
    showToast("Selecciona al menos una funcion.");
    return;
  }
  state.users.push({
    id: safeId("user"),
    username,
    password,
    name,
    role: roleFromFunctions(functions),
    functions,
    active: true,
    createdAt: new Date().toISOString(),
  });
  state.modal = null;
  persist();
  showToast("Usuario creado.");
  render();
}

function editUser(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede editar usuarios.");
    return;
  }
  const userId = event.currentTarget.dataset.userId;
  const user = state.users.find((item) => item.id === userId && item.active);
  if (!user) return;
  const form = new FormData(event.currentTarget);
  const username = cleanUserText(form.get("username"));
  const name = cleanUserText(form.get("name"));
  const functions = form.getAll("functions").map(String);
  if (!username || !name) {
    showToast("Captura nombre y usuario.");
    return;
  }
  if (state.users.some((item) => item.active && item.id !== user.id && sameUsername(item.username, username))) {
    showToast("Ese usuario ya existe.");
    return;
  }
  if (!functions.length) {
    showToast("Selecciona al menos una funcion.");
    return;
  }
  const wasAdmin = normalizeUserFunctions(user).includes("admin");
  const willBeAdmin = functions.includes("admin");
  if (wasAdmin && !willBeAdmin && activeAdmins().length <= 1) {
    showToast("Debe quedar al menos un admin activo.");
    return;
  }
  user.username = username;
  user.name = name;
  user.functions = functions;
  user.role = roleFromFunctions(functions);
  user.updatedAt = new Date().toISOString();
  user.updatedBy = currentUser()?.id;
  state.modal = null;
  persist();
  showToast("Usuario actualizado.");
  render();
}

function activeAdmins() {
  return state.users.filter((user) => user.active && normalizeUserFunctions(user).includes("admin"));
}

function canDeleteUser(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user || !user.active) return false;
  if (user.id === currentUser()?.id) return false;
  if (normalizeUserFunctions(user).includes("admin") && activeAdmins().length <= 1) return false;
  return true;
}

function resetUserPassword(userId) {
  if (!isAdminUser()) {
    showToast("Solo admin puede resetear contrasenas.");
    return;
  }
  const user = state.users.find((item) => item.id === userId && item.active);
  if (!user) return;
  const password = window.prompt(`Nueva contrasena para ${user.name}`, "1234");
  if (password === null) return;
  const nextPassword = String(password).trim();
  if (!nextPassword) {
    showToast("La contrasena no puede estar vacia.");
    return;
  }
  user.password = nextPassword;
  user.passwordResetAt = new Date().toISOString();
  user.passwordResetBy = currentUser()?.id;
  persist();
  showToast(`Contrasena actualizada para ${user.name}.`);
  render();
}

function deleteUser(userId) {
  if (!isAdminUser()) {
    showToast("Solo admin puede borrar usuarios.");
    return;
  }
  const user = state.users.find((item) => item.id === userId && item.active);
  if (!user) return;
  if (!canDeleteUser(userId)) {
    showToast("No se puede borrar este usuario.");
    return;
  }
  // Confirmación con texto para evitar borrar usuarios por error.
  const typed = window.prompt(
    `Vas a borrar a "${user.name}". Esta acción es irreversible y ya no podrá iniciar sesión.\n\nEscribe el nombre del usuario para confirmar:`,
    "",
  );
  if (typed === null) return;
  if (typed.trim().toLowerCase() !== user.name.trim().toLowerCase()) {
    showToast("Cancelado. El nombre no coincide.");
    return;
  }
  const deletedAt = new Date().toISOString();
  const shift = currentShift(user.id);
  if (shift) {
    shift.clockOutAt = deletedAt;
    shift.clockOutBy = currentUser()?.id;
  }
  state.users = state.users.filter((item) => item.id !== user.id);
  persist();
  showToast(`${user.name} borrado.`);
  render();
}

function toggleClock(userId, action) {
  const user = state.users.find((item) => item.id === userId && item.active);
  if (!user) return;
  if (user.id !== currentUser()?.id && !isAdminUser()) {
    showToast("Solo puedes fichar tu propio usuario.");
    return;
  }
  state.attendance = Array.isArray(state.attendance) ? state.attendance : [];
  const openShift = currentShift(userId);
  const now = new Date().toISOString();
  if (action === "out") {
    if (!openShift) {
      showToast("Ese usuario no tiene entrada abierta.");
      render();
      return;
    }
    openShift.clockOutAt = now;
    openShift.clockOutBy = currentUser()?.id;
    persist();
    showToast(`Salida registrada para ${user.name}.`);
    render();
    return;
  }
  if (openShift) {
    showToast("Ese usuario ya tiene una entrada abierta.");
    render();
    return;
  }
  state.attendance.unshift({
    id: safeId("shift"),
    userId,
    clockInAt: now,
    clockInBy: currentUser()?.id,
  });
  persist();
  showToast(`Entrada registrada para ${user.name}.`);
  render();
}

function resetData(action) {
  if (!isAdminUser()) {
    showToast("Solo admin puede reiniciar datos.");
    return;
  }
  const labels = {
    "inventory-zero": "poner todo el inventario en cero",
    "expenses-zero": "poner todos los gastos en cero",
    "sales-data": "borrar ventas, cortes y cancelaciones",
    operations: "borrar la operacion completa del POS",
  };
  // Confirmación con doble paso: el usuario debe ESCRIBIR la palabra para evitar clicks accidentales.
  const challenge = action === "operations" ? "BORRAR TODO" : "ELIMINAR";
  const typed = window.prompt(
    `Vas a ${labels[action] || "reiniciar datos"}.\n\nEsta acción es irreversible.\nEscribe "${challenge}" para confirmar:`,
    "",
  );
  if (typed === null) return;
  if (typed.trim().toUpperCase() !== challenge) {
    showToast("Cancelado. El texto no coincide.");
    return;
  }
  if (action === "inventory-zero") {
    currentInventory().forEach((item) => {
      item.qty = 0;
      item.totalCost = 0;
    });
    state.inventoryMovements.unshift({
      id: safeId("mov"),
      itemId: "all",
      itemName: "Inventario completo",
      qty: 0,
      unit: "",
      reason: "Reset de inventario a cero",
      source: "reset",
      createdAt: new Date().toISOString(),
      userId: currentUser()?.id,
    });
    showToast("Inventario puesto en cero.");
  }
  if (action === "expenses-zero") {
    state.expenses = normalizeExpenses(state.expenses).map((item) => ({ ...item, amount: 0 }));
    showToast("Gastos puestos en cero.");
  }
  if (action === "sales-data") {
    state.sales = [];
    state.cashSessions = [];
    state.cancellations = [];
    showToast("Ventas, caja y cancelaciones reiniciadas.");
  }
  if (action === "operations") {
    state.activeOrderId = null;
    state.productConfig = null;
    state.modal = null;
    state.orders = [];
    state.sales = [];
    state.cashSessions = [];
    state.cancellations = [];
    state.inventoryMovements = [];
    state.expenses = normalizeExpenses(state.expenses).map((item) => ({ ...item, amount: 0 }));
    showToast("Operacion reiniciada.");
  }
  persist();
  render();
}

function openCashSession(event) {
  event.preventDefault();
  if (!hasCashAccess()) {
    showToast("No tienes permiso de caja.");
    return;
  }
  if (currentCashSession()) {
    showToast("Ya hay una caja abierta.");
    render();
    return;
  }
  const form = new FormData(event.currentTarget);
  const openingCash = Math.max(0, Number(form.get("openingCash")) || 0);
  state.cashSessions = normalizeCashSessions(state.cashSessions);
  state.cashSessions.unshift({
    id: safeId("cash"),
    status: "open",
    openingCash,
    note: String(form.get("note") || "").trim(),
    openedAt: new Date().toISOString(),
    openedBy: currentUser()?.id,
  });
  persist();
  showToast("Caja abierta.");
  render();
}

function closeCashSession(event) {
  event.preventDefault();
  if (!hasCashAccess()) {
    showToast("No tienes permiso de caja.");
    return;
  }
  const session = currentCashSession();
  if (!session || session.id !== event.currentTarget.dataset.sessionId) {
    showToast("No se encontro la caja abierta.");
    render();
    return;
  }
  if (getOpenOrders().length) {
    showToast("Cierra o cancela las ordenes abiertas antes del corte.");
    return;
  }
  const form = new FormData(event.currentTarget);
  const countedCash = Math.max(0, Number(form.get("countedCash")) || 0);
  const totals = cashSessionTotals(session);
  const difference = Math.round((countedCash - totals.expectedCash) * 100) / 100;
  // Confirmación explícita: cerrar caja finaliza el turno (irreversible para esta sesión).
  const diffText =
    Math.abs(difference) < 0.005
      ? "sin diferencia"
      : difference > 0
        ? `con un sobrante de ${money.format(difference)}`
        : `con un faltante de ${money.format(Math.abs(difference))}`;
  if (!window.confirm(`Cerrar caja: efectivo contado ${money.format(countedCash)} (${diffText}).\n\n¿Confirmas el corte?`)) {
    return;
  }
  const now = new Date().toISOString();
  Object.assign(session, {
    status: "closed",
    closedAt: now,
    closedBy: currentUser()?.id,
    countedCash,
    openingCash: totals.openingCash,
    cashSales: totals.cash,
    cardSales: totals.card,
    totalSales: totals.total,
    iva: totals.iva,
    ivaEnabled: totals.iva > 0,
    taxEnabled: totals.iva > 0,
    cashExpenses: totals.cashExpenses || 0,
    cashTips: totals.cashTips,
    cardTips: totals.cardTips,
    tips: totals.tips,
    expectedCash: totals.expectedCash,
    difference,
    closeNote: String(form.get("note") || "").trim(),
  });
  persist();
  showToast(`Caja cerrada. Diferencia ${money.format(difference)}.`);
  render();
}

function addExpense(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede registrar gastos.");
    return;
  }
  const form = new FormData(event.currentTarget);
  const amount = Math.max(0, Number(form.get("amount")) || 0);
  const supplier = cleanUserText(form.get("supplier"));
  const name = cleanUserText(form.get("name"));
  if (!supplier || !name || amount <= 0) {
    showToast("Captura proveedor, concepto e importe.");
    return;
  }
  const date = String(form.get("date") || "").trim();
  state.expenses = normalizeExpenses(state.expenses);
  state.expenses.unshift({
    id: safeId("expense"),
    supplier,
    name,
    category: cleanUserText(form.get("category")) || "General",
    amount,
    createdAt: date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString(),
    createdBy: currentUser()?.id,
    note: String(form.get("note") || "").trim(),
  });
  persist();
  showToast("Gasto registrado.");
  render();
}

function addInventoryItem(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get("name") || "").trim().toUpperCase();
  const qty = Number(form.get("qty")) || 0;
  const unitCost = Number(form.get("unitCost")) || 0;
  if (!name || qty <= 0) {
    showToast("Captura nombre y cantidad.");
    return;
  }
  const inventory = currentInventory();
  const existing = inventory.find((item) => normalize(item.name) === normalize(name));
  const category = String(form.get("category") || "GENERAL").trim().toUpperCase();
  ensureIngredientCategory(category, !isDefaultNonRecipeCategory(category));
  if (existing) {
    const previousCost = Number(existing.unitCost) || 0;
    existing.qty += qty;
    existing.unitCost = unitCost || existing.unitCost;
    existing.totalCost = existing.qty * existing.unitCost;
    if (unitCost && roundCurrency(previousCost) !== roundCurrency(existing.unitCost)) {
      existing.costHistory = normalizeCostHistory(existing.costHistory);
      existing.costHistory.unshift({
        id: safeId("cost"),
        previousCost,
        nextCost: existing.unitCost,
        changedAt: new Date().toISOString(),
        changedBy: currentUser()?.id,
        reason: "Entrada por alta/compra",
      });
    }
    recordInventoryMovement(existing, qty, "Entrada por alta/compra", "manual");
  } else {
    const item = {
      id: safeId("inv"),
      category,
      name,
      supplier: String(form.get("supplier") || "Sin proveedor").trim().toUpperCase(),
      unit: String(form.get("unit") || "PZ").trim().toUpperCase(),
      qty,
      unitCost,
      totalCost: qty * unitCost,
      recipeEligible: categoryRecipeEligible(category),
      costHistory: unitCost
        ? [{
            id: safeId("cost"),
            previousCost: 0,
            nextCost: unitCost,
            changedAt: new Date().toISOString(),
            changedBy: currentUser()?.id,
            reason: "Alta de insumo",
          }]
        : [],
    };
    inventory.push(item);
    recordInventoryMovement(item, qty, "Alta de insumo", "manual");
  }
  persist();
  showToast("Inventario actualizado.");
  render();
}

function saveIngredient(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede crear o editar insumos.");
    return;
  }
  const form = new FormData(event.currentTarget);
  const inventory = currentInventory();
  const itemId = event.currentTarget.dataset.ingredientId;
  const existing = itemId ? inventory.find((item) => item.id === itemId) : null;
  const name = String(form.get("name") || "").trim().toUpperCase();
  const category = String(form.get("category") || "GENERAL").trim().toUpperCase();
  const supplier = String(form.get("supplier") || "Sin proveedor").trim().toUpperCase();
  const unit = String(form.get("unit") || "PZ").trim().toUpperCase();
  const unitCost = Math.max(0, Number(form.get("unitCost")) || 0);
  const requestedRecipeEligible = form.get("recipeEligible") === "on";
  ensureIngredientCategory(category, requestedRecipeEligible);
  const recipeEligible = categoryRecipeEligible(category) && requestedRecipeEligible;
  const reason = cleanUserText(form.get("reason")) || (existing ? "Actualizacion de insumo" : "Alta de insumo");
  if (!name || !category || !unit) {
    showToast("Captura categoria, nombre y unidad.");
    return;
  }
  const duplicate = inventory.find((item) => item.id !== existing?.id && normalize(item.name) === normalize(name));
  if (duplicate) {
    showToast("Ya existe un insumo con ese nombre.");
    return;
  }
  const now = new Date().toISOString();
  if (existing) {
    const previousCost = Number(existing.unitCost) || 0;
    existing.category = category;
    existing.name = name;
    existing.supplier = supplier;
    existing.unit = unit;
    existing.unitCost = unitCost;
    existing.recipeEligible = recipeEligible;
    existing.totalCost = (Number(existing.qty) || 0) * unitCost;
    existing.updatedAt = now;
    existing.updatedBy = currentUser()?.id;
    if (roundCurrency(previousCost) !== roundCurrency(unitCost)) {
      existing.costHistory = normalizeCostHistory(existing.costHistory);
      existing.costHistory.unshift({
        id: safeId("cost"),
        previousCost,
        nextCost: unitCost,
        changedAt: now,
        changedBy: currentUser()?.id,
        reason,
      });
    }
    showToast("Insumo actualizado.");
  } else {
    inventory.unshift({
      id: safeId("inv"),
      category,
      name,
      supplier,
      unit,
      qty: 0,
      unitCost,
      recipeEligible,
      totalCost: 0,
      costHistory: unitCost
        ? [{
            id: safeId("cost"),
            previousCost: 0,
            nextCost: unitCost,
            changedAt: now,
            changedBy: currentUser()?.id,
            reason,
          }]
        : [],
      createdAt: now,
      createdBy: currentUser()?.id,
    });
    showToast("Insumo creado.");
  }
  state.ingredientsCategory = category;
  state.modal = null;
  persist();
  render();
}

function ensureIngredientCategory(categoryName, recipeEligible = true, { overwrite = false } = {}) {
  const name = String(categoryName || "").trim().toUpperCase();
  if (!name) return null;
  state.ingredientCategories = normalizeIngredientCategories(state.ingredientCategories, state.inventory);
  let category = state.ingredientCategories.find((item) => item.name === name);
  const nextRecipeEligible = !isDefaultNonRecipeCategory(name) && recipeEligible !== false;
  if (!category) {
    category = { name, recipeEligible: nextRecipeEligible };
    state.ingredientCategories.push(category);
    state.ingredientCategories.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return category;
  }
  if (overwrite) category.recipeEligible = nextRecipeEligible;
  return category;
}

function createIngredientCategory(event = null) {
  event?.preventDefault?.();
  if (!isAdminUser()) {
    showToast("Solo admin puede crear categorias.");
    return;
  }
  const form = event?.currentTarget ? new FormData(event.currentTarget) : null;
  const input = document.querySelector("[data-new-ingredient-category]");
  const name = String(form?.get("category") || input?.value || "").trim().toUpperCase();
  const nonRecipe = form ? form.get("nonRecipe") === "on" : false;
  if (!name) {
    showToast("Captura nombre de categoria.");
    input?.focus();
    return;
  }
  ensureIngredientCategory(name, !nonRecipe, { overwrite: true });
  currentInventory()
    .filter((item) => item.category === name && !categoryRecipeEligible(name))
    .forEach((item) => {
      item.recipeEligible = false;
    });
  state.ingredientsCategory = name;
  state.ingredientsCategoryScroll = 0;
  state.ingredientsCategorySearch = "";
  state.modal = null;
  persist();
  showToast(`Categoria creada: ${name}.`);
  render();
}

function scrollIngredientCategories(direction) {
  const row = document.querySelector("[data-ingredients-category-scroll]");
  if (!row) return;
  const amount = Math.max(220, Math.floor(row.clientWidth * 0.8));
  row.scrollLeft += direction * amount;
  state.ingredientsCategoryScroll = row.scrollLeft;
  persist();
}

function updateIngredientCategory(itemId, value) {
  if (!isAdminUser()) {
    showToast("Solo admin puede editar insumos.");
    render();
    return;
  }
  const category = String(value || "").trim().toUpperCase();
  if (!category) {
    showToast("Captura una categoria.");
    render();
    return;
  }
  const item = currentInventory().find((entry) => entry.id === itemId);
  if (!item) return;
  ensureIngredientCategory(category, item.recipeEligible !== false);
  item.category = category;
  if (!categoryRecipeEligible(category)) item.recipeEligible = false;
  item.updatedAt = new Date().toISOString();
  item.updatedBy = currentUser()?.id;
  state.ingredientsCategory = category;
  state.ingredientsCategoryScroll = 0;
  persist();
  showToast(`Categoria actualizada: ${category}.`);
  render();
}

function setIngredientRecipeEligible(itemId, recipeEligible) {
  if (!isAdminUser()) {
    showToast("Solo admin puede editar insumos.");
    render();
    return;
  }
  const item = currentInventory().find((entry) => entry.id === itemId);
  if (!item) return;
  if (isDefaultNonRecipeCategory(item.category) && recipeEligible) {
    showToast("Esta categoria esta marcada como no-receta.");
    render();
    return;
  }
  item.recipeEligible = Boolean(recipeEligible);
  item.updatedAt = new Date().toISOString();
  item.updatedBy = currentUser()?.id;
  persist();
  showToast(recipeEligible ? "Insumo disponible para recetas." : "Insumo marcado como no-receta.");
  render();
}

function saveExtraDefinition(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede crear o editar extras.");
    return;
  }
  const form = new FormData(event.currentTarget);
  const extras = extraCatalog({ includeInactive: true });
  const extraId = event.currentTarget.dataset.extraId;
  const existing = extraId ? extras.find((extra) => extra.id === extraId) : null;
  const name = cleanUserText(form.get("name"));
  const price = Math.max(0, Number(form.get("price")) || 0);
  const qty = Math.max(0, Number(form.get("qty")) || 0);
  const inventoryItem = currentInventory().find((item) => item.id === String(form.get("inventoryItemId") || ""));
  if (!name || price <= 0 || qty <= 0 || !inventoryItem) {
    showToast("Captura extra, precio, gramaje e insumo.");
    return;
  }
  const duplicate = extras.find((extra) => extra.id !== existing?.id && normalize(extra.name) === normalize(name));
  if (duplicate) {
    showToast("Ya existe un extra con ese nombre.");
    return;
  }
  const now = new Date().toISOString();
  const payload = {
    ...(existing || {}),
    id: existing?.id || uniqueExtraId(name),
    name,
    price: roundCurrency(price),
    inventoryItemId: inventoryItem.id,
    inventoryItemName: inventoryItem.name,
    unit: inventoryItem.unit,
    qty,
    active: form.get("active") === "on",
    createdAt: existing?.createdAt || now,
    createdBy: existing?.createdBy || currentUser()?.id,
    updatedAt: existing ? now : "",
    updatedBy: existing ? currentUser()?.id : "",
  };
  if (existing) {
    Object.assign(existing, payload);
    showToast("Extra actualizado.");
  } else {
    state.extraCatalog.unshift(payload);
    showToast("Extra creado.");
  }
  state.recipesMode = "extras";
  state.modal = null;
  persist();
  if (Number(inventoryItem.qty) <= 0) showToast("Extra guardado. Aviso: el insumo vinculado esta en cero.");
  render();
}

function uniqueExtraId(name) {
  const base = `extra-${slugify(name)}`;
  const existingIds = new Set(extraCatalog({ includeInactive: true }).map((extra) => extra.id));
  if (!existingIds.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const id = `${base}-${index}`;
    if (!existingIds.has(id)) return id;
  }
  return safeId(base);
}

function setExtraActive(extraId, active) {
  if (!isAdminUser()) {
    showToast("Solo admin puede editar extras.");
    render();
    return;
  }
  const extra = getExtraDefinition(extraId);
  if (!extra) return;
  extra.active = Boolean(active);
  extra.updatedAt = new Date().toISOString();
  extra.updatedBy = currentUser()?.id;
  persist();
  showToast(active ? "Extra activado." : "Extra oculto de venta.");
  render();
}

function uniqueMenuProductId(name) {
  const base = `custom-${slugify(name)}`;
  const existingIds = new Set(menuProducts({ includeInactive: true }).map((product) => product.id));
  if (!existingIds.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const id = `${base}-${index}`;
    if (!existingIds.has(id)) return id;
  }
  return safeId(base);
}

function preventMenuProductEnterSubmit(event) {
  if (event.key !== "Enter") return;
  if (event.target?.tagName === "TEXTAREA") return;
  event.preventDefault();
}

function cloneRecipeRow({ variant = false } = {}) {
  const template = document.querySelector("[data-recipe-row-template]");
  const row = template?.content?.querySelector(".recipe-row")?.cloneNode(true);
  if (!row) return null;
  row.querySelectorAll("select, input").forEach((field) => {
    field.value = "";
  });
  if (variant) {
    const itemField = row.querySelector("[data-recipe-item]");
    const qtyField = row.querySelector("[data-recipe-qty]");
    itemField?.removeAttribute("data-recipe-item");
    itemField?.setAttribute("data-variant-item", "");
    qtyField?.removeAttribute("data-recipe-qty");
    qtyField?.setAttribute("data-variant-qty", "");
  }
  return row;
}

function renumberRecipeRows(container) {
  [...(container?.querySelectorAll(".recipe-row") || [])].forEach((row, index) => {
    const label = row.querySelector(".field span");
    if (label) label.textContent = `Insumo ${index + 1}`;
  });
}

function addRecipeRow(button) {
  const list = button.closest(".recipe-editor")?.querySelector("[data-recipe-row-list]");
  const row = cloneRecipeRow();
  if (!list || !row) return;
  list.append(row);
  renumberRecipeRows(list);
  row.querySelector("select")?.focus();
}

function addVariantRecipeRow(button) {
  const list = button.closest(".variant-recipe-body")?.querySelector("[data-variant-row-list]");
  const row = cloneRecipeRow({ variant: true });
  if (!list || !row) return;
  list.append(row);
  renumberRecipeRows(list);
  updateVariantSummary(button.closest("[data-variant-recipe]"));
  row.querySelector("select")?.focus();
}

function variantOptionFromForm(formElement) {
  const addBox = formElement.querySelector("[data-primary-variant-option-id]");
  return {
    optionId: String(addBox?.dataset.primaryVariantOptionId || "variante"),
    optionLabel: cleanUserText(addBox?.dataset.primaryVariantOptionLabel || "Variante"),
  };
}

function cloneVariantRowsFromSource(formElement, optionId) {
  const sourceList =
    formElement.querySelector(`[data-variant-recipe][data-option-id="${cssEscape(optionId)}"] [data-variant-row-list]`)
    || formElement.querySelector("[data-variant-recipe] [data-variant-row-list]")
    || formElement.querySelector("[data-recipe-row-list]");
  const rows = [...(sourceList?.querySelectorAll(".recipe-row") || [])].map((row) => {
    const clone = row.cloneNode(true);
    const recipeItem = clone.querySelector("[data-recipe-item]");
    const recipeQty = clone.querySelector("[data-recipe-qty]");
    recipeItem?.removeAttribute("data-recipe-item");
    recipeItem?.setAttribute("data-variant-item", "");
    recipeQty?.removeAttribute("data-recipe-qty");
    recipeQty?.setAttribute("data-variant-qty", "");
    return clone;
  });
  if (rows.length) return rows;
  const row = cloneRecipeRow({ variant: true });
  return row ? [row] : [];
}

function countRecipeRowsWithQty(container) {
  return [...(container?.querySelectorAll("[data-variant-qty], [data-recipe-qty]") || [])].filter(
    (input) => Number(input.value) > 0,
  ).length;
}

function variantMarginFromContainer(formElement, container) {
  const form = new FormData(formElement);
  const basePrice = menuProductGrossPriceFromBase(form.get("price"));
  const product = getProduct(formElement.dataset.productId);
  const option = product?.options?.find((item) => item.id === container?.dataset.optionId);
  const choice = option?.choices?.find((item) => normalize(item.label) === normalize(container?.dataset.choiceLabel));
  let price = basePrice;
  if (choice && Number.isFinite(choice.price)) price = Number(choice.price);
  if (choice && Number.isFinite(choice.priceDelta)) price += Number(choice.priceDelta);
  const recipe = readRecipeFromContainer(container, "[data-variant-item]", "[data-variant-qty]");
  return financialMetrics(price, recipeCostForItems(recipe)).margin;
}

function updateVariantSummary(details) {
  const formElement = details?.closest("[data-menu-product-form]");
  const countLabel = details?.querySelector("summary strong");
  const activeInput = details?.querySelector("[data-variant-active]");
  if (!formElement || !details || !countLabel) return;
  const active = activeInput?.checked !== false;
  details.classList.toggle("is-cancelled", !active);
  countLabel.textContent = variantSummaryText({
    active,
    recipeCount: countRecipeRowsWithQty(details),
    margin: variantMarginFromContainer(formElement, details),
  });
}

function updateVariantActivePreview(input) {
  updateVariantSummary(input.closest("[data-variant-recipe]"));
}

function updateVariantSummaryFromEvent(event) {
  const target = event.target;
  if (!target?.matches) return;
  const formElement = event.currentTarget;
  if (target.matches('[name="price"]')) {
    formElement.querySelectorAll("[data-variant-recipe]").forEach(updateVariantSummary);
    return;
  }
  if (target.matches("[data-variant-item], [data-variant-qty], [data-variant-active]")) {
    updateVariantSummary(target.closest("[data-variant-recipe]"));
  }
}

function updateMenuProductFormPreviewFromEvent(event) {
  updateMenuProductPricePreview(event.currentTarget);
  updateVariantSummaryFromEvent(event);
}

function addVariantChoice(button) {
  const formElement = button.closest("[data-menu-product-form]");
  const list = formElement?.querySelector("[data-variant-list]");
  if (!formElement || !list) return;
  const form = new FormData(formElement);
  const choiceLabel = cleanUserText(form.get("newVariantLabel"));
  if (!choiceLabel) {
    showToast("Captura el nombre de la variante.");
    return;
  }
  const { optionId, optionLabel } = variantOptionFromForm(formElement, form);
  const duplicate = [...list.querySelectorAll("[data-variant-recipe]")].find(
    (entry) => entry.dataset.optionId === optionId && normalize(entry.dataset.choiceLabel) === normalize(choiceLabel),
  );
  if (duplicate) {
    duplicate.open = true;
    showToast("Esa variante ya existe.");
    return;
  }

  const details = document.createElement("details");
  details.className = "variant-recipe";
  details.open = true;
  details.dataset.variantRecipe = "";
  details.dataset.optionId = optionId;
  details.dataset.optionLabel = optionLabel;
  details.dataset.choiceLabel = choiceLabel;
  details.innerHTML = `
    <summary>
      <span>${escapeHtml(optionLabel)}: ${escapeHtml(choiceLabel)}</span>
      <strong>${variantSummaryText({ active: true })}</strong>
    </summary>
    <div class="variant-recipe-body">
      <label class="check-toggle">
        <input type="checkbox" data-variant-active checked />
        <span>Disponible en venta</span>
      </label>
      <div class="recipe-row-list" data-variant-row-list></div>
      <button class="secondary-button compact" type="button" data-add-variant-row>${svg("plus")}Anadir insumo</button>
    </div>
  `;
  const rowList = details.querySelector("[data-variant-row-list]");
  const rows = cloneVariantRowsFromSource(formElement, optionId);
  if (rowList && rows.length) {
    rows.forEach((row) => rowList.append(row));
    renumberRecipeRows(rowList);
  }
  updateVariantSummary(details);
  details.querySelector("[data-add-variant-row]")?.addEventListener("click", (event) => {
    addVariantRecipeRow(event.currentTarget);
  });
  details.querySelector("[data-variant-active]")?.addEventListener("change", (event) => {
    updateVariantActivePreview(event.currentTarget);
  });
  list.append(details);
  formElement.querySelector('[name="newVariantLabel"]').value = "";
  rowList?.querySelector("select")?.focus();
  showToast("Variante anadida. Guarda cambios al terminar.");
}

function readRecipeFromContainer(container, itemSelector = "[data-recipe-item]", qtySelector = "[data-recipe-qty]") {
  const itemFields = [...container.querySelectorAll(itemSelector)];
  const qtyFields = [...container.querySelectorAll(qtySelector)];
  return normalizeRecipe(
    itemFields
      .map((field, index) => {
        const item = currentInventory().find((entry) => entry.id === field.value);
        const qty = Math.max(0, Number(qtyFields[index]?.value) || 0);
        if (!item || qty <= 0) return null;
        return {
          itemId: item.id,
          name: item.name,
          unit: item.unit,
          qty,
        };
      })
      .filter(Boolean),
  );
}

function readVariantRecipesFromForm(formElement) {
  return [...formElement.querySelectorAll("[data-variant-recipe]")]
    .map((container) => {
      const recipe = readRecipeFromContainer(container, "[data-variant-item]", "[data-variant-qty]");
      if (!recipe.length) return null;
      return {
        id: `variant-${slugify(`${container.dataset.optionId}-${container.dataset.choiceLabel}`)}`,
        optionId: String(container.dataset.optionId || ""),
        choiceLabel: cleanUserText(container.dataset.choiceLabel),
        recipe,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser()?.id,
      };
    })
    .filter(Boolean);
}

function ensureRecipeVariantOption(options, optionId, optionLabel) {
  const cleanOptionId = String(optionId || slugify(optionLabel) || "variante");
  const cleanOptionLabel = cleanUserText(optionLabel || "Variante");
  let option =
    options.find((item) => item.id === cleanOptionId)
    || options.find((item) => item.type === "single" && normalize(item.label) === normalize(cleanOptionLabel));
  if (!option) {
    option = {
      id: cleanOptionId,
      label: cleanOptionLabel,
      type: "single",
      required: true,
      choices: [],
    };
    options.push(option);
  }
  option.type = "single";
  option.label = cleanUserText(option.label || cleanOptionLabel || "Variante");
  option.required = option.required !== false;
  option.choices = Array.isArray(option.choices) ? option.choices : [];
  return option;
}

function addVariantChoiceToOption(option, choiceLabel, active = true) {
  const label = cleanUserText(choiceLabel);
  if (!label) return;
  const existing = option.choices.find((choice) => normalize(choice.label) === normalize(label));
  if (existing) {
    existing.active = active !== false;
    return;
  }
  option.choices.push({ label, active: active !== false });
}

function optionsWithVariantDefinitions(existingOptions, formElement, form) {
  const options = normalizeProductOptions(existingOptions);
  [...formElement.querySelectorAll("[data-variant-recipe]")].forEach((container) => {
    const option = ensureRecipeVariantOption(options, container.dataset.optionId, container.dataset.optionLabel);
    const active = container.querySelector("[data-variant-active]")?.checked !== false;
    addVariantChoiceToOption(option, container.dataset.choiceLabel, active);
  });
  const newVariantLabel = cleanUserText(form.get("newVariantLabel"));
  if (newVariantLabel) {
    const { optionId, optionLabel } = variantOptionFromForm(formElement, form);
    const option = ensureRecipeVariantOption(options, optionId, optionLabel);
    addVariantChoiceToOption(option, newVariantLabel);
  }
  return options;
}

function readMenuProductForm(formElement, existing = null) {
  const form = new FormData(formElement);
  const name = cleanUserText(form.get("name"));
  const section = cleanUserText(form.get("section"));
  const subsection = cleanUserText(form.get("subsection"));
  const basePrice = roundCurrency(Math.max(0, Number(form.get("price")) || 0));
  const price = menuProductGrossPriceFromBase(basePrice);
  if (!name || !section || !subsection || basePrice <= 0) {
    showToast("Captura nombre, categoria, subcategoria y precio.");
    return null;
  }
  const recipe = readRecipeFromContainer(formElement);
  if (!recipe.length) {
    showToast("Agrega al menos un insumo con cantidad para la receta.");
    return null;
  }
  const now = new Date().toISOString();
  const id = existing?.id || uniqueMenuProductId(name);
  const isBaseProduct = baseMenuProductIds().has(id);
  const options = optionsWithVariantDefinitions(existing?.options, formElement, form);
  const variantRecipes = formElement.querySelector("[data-variant-recipe]")
    ? readVariantRecipesFromForm(formElement)
    : normalizeVariantRecipes(existing?.variantRecipes);
  const previousRecipeState = {
    recipe: normalizeRecipe(existing?.recipe?.length ? existing.recipe : recipeForProduct(existing || { options: [], recipe: [] })),
    variantRecipes: normalizeVariantRecipes(existing?.variantRecipes),
  };
  const nextRecipeState = { recipe: normalizeRecipe(recipe), variantRecipes: normalizeVariantRecipes(variantRecipes) };
  const recipeHistory = normalizeProductHistory(existing?.recipeHistory);
  if (existing && !isSameJson(previousRecipeState, nextRecipeState)) {
    recipeHistory.unshift({
      id: safeId("recipe-history"),
      changedAt: now,
      changedBy: currentUser()?.id,
      reason: "Cambio de receta",
      previous: previousRecipeState,
      next: nextRecipeState,
    });
  }
  const priceHistory = normalizeProductHistory(existing?.priceHistory);
  if (existing && roundCurrency(existing.price) !== roundCurrency(price)) {
    priceHistory.unshift({
      id: safeId("price-history"),
      changedAt: now,
      changedBy: currentUser()?.id,
      reason: "Cambio de precio de venta",
      previous: { basePrice: menuProductBasePriceFromGross(existing.price), price: roundCurrency(existing.price) },
      next: { basePrice, price: roundCurrency(price) },
    });
  }
  return {
    ...(existing || {}),
    id,
    name,
    section,
    subsection,
    price,
    station: existing?.station || "Cocina",
    icon: icons[form.get("icon")] ? String(form.get("icon")) : "plate",
    description: cleanUserText(form.get("description")) || "Platillo creado en LibrePOS.",
    options,
    recipe: normalizeRecipe(recipe),
    variantRecipes: normalizeVariantRecipes(variantRecipes),
    recipeHistory,
    priceHistory,
    active: form.get("active") === "on",
    custom: !isBaseProduct,
    createdAt: existing?.createdAt || now,
    createdBy: existing?.createdBy || currentUser()?.id,
    updatedAt: existing ? now : "",
    updatedBy: existing ? currentUser()?.id : "",
  };
}

function saveMenuProduct(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede crear o editar platillos.");
    return;
  }
  state.menuProducts = normalizeMenuProducts(state.menuProducts);
  const productId = event.currentTarget.dataset.productId;
  const existing = productId ? state.menuProducts.find((product) => product.id === productId) : null;
  const currentProduct = productId ? getProduct(productId) : null;
  const product = readMenuProductForm(event.currentTarget, currentProduct || existing);
  if (!product) return;
  if (existing) {
    Object.assign(existing, product);
    showToast("Platillo actualizado.");
  } else {
    state.menuProducts.unshift(product);
    showToast("Platillo creado.");
  }
  state.activeSection = product.section;
  state.activeSubsection = "Todos";
  state.modal = null;
  persist();
  render();
}

function toggleMenuProduct(productId) {
  const product = editableMenuProduct(productId);
  if (!product) return;
  setMenuProductActive(productId, product.active === false);
}

function editableMenuProduct(productId) {
  if (!isAdminUser()) {
    showToast("Solo admin puede editar platillos.");
    return null;
  }
  state.menuProducts = normalizeMenuProducts(state.menuProducts);
  let product = state.menuProducts.find((item) => item.id === productId);
  if (!product) {
    const source = getProduct(productId);
    if (!source) return null;
    product = normalizeMenuProducts([{ ...source, custom: !baseMenuProductIds().has(source.id) }])[0];
    state.menuProducts.unshift(product);
  }
  return product;
}

function setMenuProductActive(productId, active) {
  const product = editableMenuProduct(productId);
  if (!product) return;
  product.active = Boolean(active);
  product.updatedAt = new Date().toISOString();
  product.updatedBy = currentUser()?.id;
  persist();
  showToast(active ? "Platillo activado." : "Platillo oculto del menu.");
  render();
}

function adjustInventoryFromForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const qty = Math.abs(Number(form.get("qty")) || 0);
  if (!qty) {
    showToast("Captura una cantidad valida.");
    return;
  }
  const direction = String(form.get("direction"));
  const signedQty = direction === "out" ? -qty : qty;
  adjustInventory(String(form.get("itemId")), signedQty, String(form.get("reason") || "Movimiento manual"));
}

function submitInventoryPurchase(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede subir tickets de inventario.");
    return;
  }
  const form = new FormData(event.currentTarget);
  const item = currentInventory().find((entry) => entry.id === String(form.get("itemId") || ""));
  const qty = Math.abs(Number(form.get("qty")) || 0);
  const amount = roundCurrency(Math.abs(Number(form.get("amount")) || 0));
  if (!item || qty <= 0 || amount <= 0) {
    showToast("Captura insumo, cantidad y coste del ticket.");
    return;
  }
  const now = new Date().toISOString();
  const previousCost = Number(item.unitCost) || 0;
  const nextUnitCost = roundCurrency(amount / qty);
  const supplier = cleanUserText(form.get("supplier")) || item.supplier || "Sin proveedor";
  const ticket = cleanUserText(form.get("ticket"));
  item.supplier = supplier;
  item.qty = Number(item.qty) + qty;
  item.unitCost = nextUnitCost || item.unitCost;
  item.totalCost = item.qty * item.unitCost;
  if (roundCurrency(previousCost) !== roundCurrency(item.unitCost)) {
    item.costHistory = normalizeCostHistory(item.costHistory);
    item.costHistory.unshift({
      id: safeId("cost"),
      previousCost,
      nextCost: item.unitCost,
      changedAt: now,
      changedBy: currentUser()?.id,
      reason: ticket ? `Ticket ${ticket}` : "Ticket de inventario",
    });
  }
  const activeCash = currentCashSession();
  recordInventoryMovement(item, qty, ticket ? `Ticket ${ticket}` : "Ticket de inventario", "compra", {
    amount,
    unitCost: item.unitCost,
    cashSessionId: activeCash?.id || "",
  });
  state.expenses = normalizeExpenses(state.expenses);
  state.expenses.unshift({
    id: safeId("expense"),
    supplier,
    name: `Compra ${item.name}`,
    category: "Inventario",
    amount,
    createdAt: now,
    createdBy: currentUser()?.id,
    cashSessionId: activeCash?.id || "",
    source: "inventario-ticket",
    inventoryItemId: item.id,
    qty,
    note: ticket || "Subida desde inventario",
  });
  persist();
  showToast(activeCash ? "Ticket registrado. Inventario subido y efectivo esperado ajustado." : "Ticket registrado. Inventario subido y gasto guardado.");
  render();
}

function submitInventoryWaste(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede registrar merma.");
    return;
  }
  const form = new FormData(event.currentTarget);
  const item = currentInventory().find((entry) => entry.id === String(form.get("itemId") || ""));
  const qty = Math.abs(Number(form.get("qty")) || 0);
  const reason = cleanUserText(form.get("reason"));
  if (!item || qty <= 0 || !reason) {
    showToast("Captura insumo, cantidad y motivo de merma.");
    return;
  }
  if (qty > Number(item.qty || 0)) {
    showToast("La merma no puede ser mayor al inventario registrado.");
    return;
  }
  adjustInventory(item.id, -qty, `Merma: ${reason}`, "merma");
}

function adjustInventory(itemId, signedQty, reason, source = "manual", details = {}) {
  const item = currentInventory().find((entry) => entry.id === itemId);
  if (!item) return;
  const nextQty = Math.max(0, Number(item.qty) + signedQty);
  const appliedQty = nextQty - Number(item.qty);
  if (!appliedQty) {
    showToast("El inventario ya esta en cero.");
    return;
  }
  item.qty = nextQty;
  item.totalCost = item.qty * item.unitCost;
  recordInventoryMovement(item, appliedQty, reason, source, details);
  persist();
  render();
}

function recordInventoryMovement(item, signedQty, reason, source, details = {}) {
  state.inventoryMovements.unshift({
    id: safeId("mov"),
    itemId: item.id,
    itemName: item.name,
    qty: signedQty,
    unit: item.unit,
    reason,
    source,
    createdAt: new Date().toISOString(),
    userId: currentUser()?.id,
    ...details,
  });
}

function updateFullInventoryPreview(form) {
  let totalVariance = 0;
  let countedRows = 0;
  form.querySelectorAll("[data-inventory-count-row]").forEach((row) => {
    const input = row.querySelector("input");
    const diffCell = row.querySelector("[data-count-diff]");
    const valueCell = row.querySelector("[data-count-value]");
    const rawValue = String(input?.value || "").trim();
    if (!rawValue) {
      if (diffCell) diffCell.textContent = "-";
      if (valueCell) valueCell.textContent = "-";
      row.classList.remove("inventory-loss", "inventory-gain");
      return;
    }
    const expected = Number(row.dataset.expected) || 0;
    const counted = Math.max(0, Number(rawValue) || 0);
    const unitCost = Number(row.dataset.unitCost) || 0;
    const diff = counted - expected;
    const value = roundCurrency(diff * unitCost);
    totalVariance += value;
    countedRows += 1;
    row.classList.toggle("inventory-loss", diff < 0);
    row.classList.toggle("inventory-gain", diff > 0);
    if (diffCell) diffCell.textContent = `${diff > 0 ? "+" : ""}${formatNumber(diff)}`;
    if (valueCell) valueCell.textContent = money.format(value);
  });
  const total = form.closest(".full-inventory-panel")?.querySelector("[data-inventory-count-total]");
  if (total) {
    const label = countedRows ? `${totalVariance >= 0 ? "Ganancia" : "Perdida"} ${money.format(Math.abs(totalVariance))}` : money.format(0);
    total.textContent = label;
    total.classList.toggle("inventory-loss", totalVariance < 0);
    total.classList.toggle("inventory-gain", totalVariance > 0);
  }
}

function applyFullInventoryCount(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showToast("Solo admin puede aplicar inventario completo.");
    return;
  }
  const form = event.currentTarget;
  updateFullInventoryPreview(form);
  const adjustments = [];
  form.querySelectorAll("[data-inventory-count-row]").forEach((row) => {
    const input = row.querySelector("input");
    const rawValue = String(input?.value || "").trim();
    if (!rawValue) return;
    const item = currentInventory().find((entry) => entry.id === row.dataset.itemId);
    if (!item) return;
    const expected = Number(item.qty) || 0;
    const counted = Math.max(0, Number(rawValue) || 0);
    const diff = counted - expected;
    if (Math.abs(diff) < 0.0005) return;
    adjustments.push({ item, expected, counted, diff });
  });
  if (!adjustments.length) {
    showToast("No hay descuadros para aplicar.");
    return;
  }
  const totalVariance = roundCurrency(adjustments.reduce((sum, entry) => sum + entry.diff * (Number(entry.item.unitCost) || 0), 0));
  const challenge = "APLICAR";
  const typed = window.prompt(
    `Se aplicaran ${adjustments.length} ajuste${adjustments.length === 1 ? "" : "s"} de inventario completo.\n\nResultado: ${totalVariance >= 0 ? "ganancia" : "perdida"} ${money.format(Math.abs(totalVariance))}.\n\nEscribe "${challenge}" para confirmar:`,
    "",
  );
  if (typed === null) return;
  if (typed.trim().toUpperCase() !== challenge) {
    showToast("Cancelado. El texto no coincide.");
    return;
  }
  adjustments.forEach(({ item, expected, counted, diff }) => {
    item.qty = counted;
    item.totalCost = item.qty * item.unitCost;
    recordInventoryMovement(
      item,
      diff,
      `Inventario completo: ${diff < 0 ? "perdida" : "ganancia"}`,
      "conteo",
      {
        expectedQty: expected,
        countedQty: counted,
        varianceValue: roundCurrency(diff * (Number(item.unitCost) || 0)),
        estimated: inventoryItemHasEstimatedExtraUsage(item),
      },
    );
  });
  persist();
  showToast(`Inventario completo aplicado: ${totalVariance >= 0 ? "ganancia" : "perdida"} ${money.format(Math.abs(totalVariance))}.`);
  render();
}

function deductInventoryForLines(lines, order) {
  aggregateInventoryUsage(lines).forEach((usageItem) => {
    const item = inventoryItemForUsage(usageItem);
    if (!item) return;
    const qty = Number(usageItem.qty) || 0;
    const nextQty = Math.max(0, Number(item.qty) - qty);
    const appliedQty = nextQty - Number(item.qty);
    if (!appliedQty) return;
    item.qty = nextQty;
    item.totalCost = item.qty * item.unitCost;
    recordInventoryMovement(item, appliedQty, `Comanda ${orderLabel(order)}${usageItem.estimated ? " · extra estimado" : ""}`, "comanda", {
      estimated: usageItem.estimated,
    });
  });
}

function restoreInventoryForLines(lines, order, reason) {
  aggregateInventoryUsage(lines).forEach((usageItem) => {
    const item = inventoryItemForUsage(usageItem);
    if (!item) return;
    const qty = Number(usageItem.qty) || 0;
    item.qty += qty;
    item.totalCost = item.qty * item.unitCost;
    recordInventoryMovement(item, qty, `${reason} · ${orderLabel(order)}${usageItem.estimated ? " · extra estimado" : ""}`, "cancelacion", {
      estimated: usageItem.estimated,
    });
  });
}

function aggregateInventoryUsage(lines) {
  const usage = new Map();
  lines.forEach((line) => {
    inventoryUsageForLine(line).forEach((item) => {
      const key = item.itemId || normalize(item.name);
      const current = usage.get(key) || {
        itemId: item.itemId || "",
        name: item.name,
        qty: 0,
        estimated: false,
      };
      current.qty += Number(item.qty) || 0;
      current.estimated = current.estimated || Boolean(item.estimated);
      usage.set(key, current);
    });
  });
  return [...usage.values()];
}

function inventoryItemForUsage(usageItem) {
  const inventory = currentInventory();
  return inventory.find((entry) => usageItem.itemId && entry.id === usageItem.itemId)
    || inventory.find((entry) => normalize(entry.name) === normalize(usageItem.name));
}

function inventoryUsageForLine(line) {
  const product = getProduct(line.productId);
  if (!product) return [];
  const extras = normalizeExtras(line.extras);
  if (product.subsection === "Pan de lena") {
    const option = product.options.find((item) => item.id === "presentacion");
    const choice = option?.choices?.[line.selections?.presentacion || 0]?.label || "Pieza";
    const units = choice.includes("10") ? 10 : choice.includes("5") ? 5 : 1;
    return [
      { name: product.name.toUpperCase(), qty: units * line.qty },
      ...extras.map((extra) => ({ itemId: extra.itemId, name: extra.inventoryItemName || extra.name, qty: extra.qty * line.qty, estimated: true })),
    ];
  }
  // Si la línea es mixta, combinamos la receta de cada parte con su peso.
  // Si no, comportamiento idéntico al anterior.
  const baseRecipe = lineParts(line)
    ? combinedRecipeForLine(product, line)
    : configuredRecipeForProduct(product, line.selections || defaultSelectionsFor(product));
  return [...baseRecipe, ...extras.map((extra) => ({ ...extra, name: extra.inventoryItemName || extra.name, estimated: true }))].map((item) => ({
    itemId: item.itemId || "",
    name: item.name,
    qty: item.qty * line.qty,
    estimated: Boolean(item.estimated),
  }));
}

function inventoryRecipeForSelections(product, selections = defaultSelectionsFor(product)) {
  const variantRecipe = recipeVariantForSelections(product, selections);
  if (variantRecipe?.recipe?.length) {
    return normalizeRecipe(variantRecipe.recipe).map((item) => ({ name: item.name, qty: item.qty }));
  }
  if (Array.isArray(product.recipe) && product.recipe.length) {
    return normalizeRecipe(product.recipe).map((item) => ({ name: item.name, qty: item.qty }));
  }
  const protein = selectedChoiceLabel(product, selections, "proteina");
  const relleno = selectedChoiceLabel(product, selections, "relleno");
  const sabor = selectedChoiceLabel(product, selections, "sabor");
  const masa = selectedChoiceLabel(product, selections, "masa");
  const salsa = selectedChoiceLabel(product, selections, "salsa");

  if (product.id === "empanadas-fritas") {
    return [
      { name: "MASA MERCADO", qty: 0.35 },
      ...ingredientChoice(relleno, {
        Queso: [{ name: "QUESO FRESCO DE ARO", qty: 0.04 }],
        Pollo: [{ name: "POLLO", qty: 0.08 }],
        Carne: [{ name: "PIERNA DE CERDO", qty: 0.08 }],
      }),
    ];
  }

  if (product.id === "bocoles-maiz") {
    return [
      { name: "MASA MERCADO", qty: 0.16 },
      ...(normalize(masa).includes("frijol") ? [{ name: "FRIJOL NEGRO", qty: 0.04 }] : []),
      ...ingredientChoice(relleno, {
        "Frijol con chorizo": [
          { name: "FRIJOL NEGRO", qty: 0.06 },
          { name: "CHORIZO", qty: 0.04 },
        ],
        "Huevo revuelto": [{ name: "HUEVO", qty: 0.08 }],
        Queso: [{ name: "QUESO FRESCO DE ARO", qty: 0.04 }],
        "Huevo con chorizo": [
          { name: "HUEVO", qty: 0.06 },
          { name: "CHORIZO", qty: 0.03 },
        ],
        "Huevo en salsa verde": [
          { name: "HUEVO", qty: 0.06 },
          { name: "CHILE SERRANO", qty: 0.015 },
        ],
      }),
    ];
  }

  if (product.id === "bocoles-harina") {
    return [
      { name: "MASA MERCADO", qty: 0.25 },
      { name: "QUESO FRESCO DE ARO", qty: 0.005 },
      ...proteinIngredients(protein),
    ];
  }

  if (product.id === "tamales") {
    return [
      { name: "MASA TAMALES", qty: 0.054 },
      { name: "HOJA DE PLATANO", qty: 0.08 },
      ...ingredientChoice(sabor, {
        Picadillo: [{ name: "PICADILLO", qty: 0.058 }],
        Cerdo: [
          { name: "PIERNA DE CERDO", qty: 0.042 },
          { name: "ADOBO", qty: 0.022 },
        ],
        "Camaron con calabaza": [
          { name: "CAMARON", qty: 0.04 },
          { name: "CALABAZA", qty: 0.03 },
        ],
        Pique: [{ name: "CHILE PIQUIN", qty: 0.004 }],
        Queso: [{ name: "QUESO FRESCO DE ARO", qty: 0.035 }],
      }),
    ];
  }

  if (product.id === "empanadas-harina") {
    return [
      { name: "MASA HARINA", qty: 0.05 },
      ...ingredientChoice(relleno, {
        Manjar: [
          { name: "MANJAR", qty: 0.05 },
          { name: "AZUCAR", qty: 0.000667 },
          { name: "CANELA MOLIDA", qty: 0.000333 },
        ],
        Carne: [{ name: "RELLENO PIERNA", qty: 0.02 }],
      }),
    ];
  }

  if (product.id === "molotes") {
    return [
      ...(normalize(masa).includes("platano")
        ? [{ name: "MASA MOLOTES PLATANO", qty: 0.14 }]
        : [{ name: "MASA MOLOTES", qty: 0.14 }]),
      { name: "REPOLLO", qty: 0.002 },
      { name: "CREMA", qty: 0.001 },
      { name: "QUESO FRESCO DE ARO", qty: 0.02 },
      { name: "SALSA MOLOTES", qty: 0.18 },
      ...ingredientChoice(relleno, {
        Pollo: [{ name: "RELLENO POLLO", qty: 0.1 }],
        "Carne de cerdo": [{ name: "RELLENO CARNE", qty: 0.1 }],
      }),
    ];
  }

  if (product.id === "enchiladas") {
    return [
      { name: "MASA MERCADO", qty: 0.16 },
      { name: "QUESO FRESCO DE ARO", qty: 0.02 },
      ...salsaIngredients(salsa),
      ...proteinIngredients(protein),
    ];
  }

  if (product.id === "enchiladas-chile-seco") {
    return [
      { name: "MASA MERCADO", qty: 0.16 },
      { name: "QUESO FRESCO DE ARO", qty: 0.02 },
      ...(normalize(salsa) === "chile seco" ? [{ name: "CHILE GUAJILLO", qty: 0.08 }] : salsaIngredients(salsa)),
      ...proteinIngredients(protein),
    ];
  }

  if (product.id === "estrujadas") {
    return [
      { name: "MASA MERCADO", qty: 0.2 },
      { name: "QUESO FRESCO DE ARO", qty: 0.02 },
      ...salsaIngredients(salsa),
      ...proteinIngredients(protein),
    ];
  }

  return inventoryRecipes[product.id] || [];
}

function recipeVariantForSelections(product, selections = defaultSelectionsFor(product)) {
  const variants = normalizeVariantRecipes(product?.variantRecipes);
  if (!variants.length) return null;
  const matches = [];
  for (const option of product.options || []) {
    if (option.type !== "single") continue;
    const choice = option.choices?.[selections?.[option.id]];
    if (!choice?.label) continue;
    const variant = variants.find(
      (item) => item.optionId === option.id && normalize(item.choiceLabel) === normalize(choice.label),
    );
    if (variant) matches.push({ option, variant });
  }
  matches.sort((left, right) => variantOptionPriority(left.option) - variantOptionPriority(right.option));
  return matches[0]?.variant || null;
}

function variantOptionPriority(option) {
  const value = normalize(`${option?.id || ""} ${option?.label || ""}`);
  if (value.includes("relleno")) return 1;
  if (value.includes("sabor")) return 2;
  if (value.includes("proteina")) return 3;
  if (value.includes("variante")) return 4;
  if (value.includes("salsa")) return 5;
  if (value.includes("masa")) return 8;
  return 6;
}

function selectedChoiceLabel(product, selections, optionId) {
  const option = product.options.find((item) => item.id === optionId);
  if (!option) return "";
  return option.choices?.[selections?.[optionId]]?.label || "";
}

function ingredientChoice(label, choices) {
  return choices[label] || [];
}

function proteinIngredients(label) {
  return ingredientChoice(label, {
    Cecina: [{ name: "CECINA PALOMILLA", qty: 0.12 }],
    "Carne enchilada": [{ name: "CARNE ENCHILADA", qty: 0.12 }],
    "Huevo revuelto": [{ name: "HUEVO", qty: 0.08 }],
    "Huevo revuelto con chorizo": [
      { name: "HUEVO", qty: 0.06 },
      { name: "CHORIZO", qty: 0.04 },
    ],
    "Huevo en salsa verde": [
      { name: "HUEVO", qty: 0.06 },
      { name: "CHILE SERRANO", qty: 0.015 },
    ],
  });
}

function salsaIngredients(label) {
  return ingredientChoice(label, {
    Entomatadas: [{ name: "JITOMATE", qty: 0.1 }],
    Roja: [{ name: "JITOMATE", qty: 0.06 }],
    Verde: [{ name: "CHILE SERRANO", qty: 0.025 }],
    Pipian: [{ name: "PIPIAN CRIOLLO", qty: 0.04 }],
    Cacahuate: [{ name: "CACAHUATE", qty: 0.04 }],
    Enfrijoladas: [{ name: "FRIJOL NEGRO", qty: 0.08 }],
    Enmoladas: [{ name: "CHILE COLOR/ANCHO", qty: 0.025 }],
    Ajonjoli: [{ name: "AJONJOLI", qty: 0.025 }],
  });
}

function inventoryUsageForProduct(product, selections = defaultSelectionsFor(product), extras = []) {
  return inventoryUsageForLine({
    productId: product.id,
    selections,
    extras,
    qty: 1,
  });
}

function pendingInventoryUsage() {
  const usage = new Map();
  getOpenOrders().forEach((order) => {
    order.items
      .filter((line) => line.status === "pending")
      .forEach((line) => {
        inventoryUsageForLine(line).forEach((item) => {
          const key = normalize(item.name);
          usage.set(key, (usage.get(key) || 0) + item.qty);
        });
      });
  });
  return usage;
}

function estimateProductStock(product, selections = defaultSelectionsFor(product), extras = [], parts = null) {
  // Si la configuración es mixto (varias partes), combinamos la receta de cada
  // parte ponderada y sumamos los extras, igual que haría inventoryUsageForLine.
  let recipeSource;
  if (Array.isArray(parts) && parts.length >= 2) {
    const fakeLine = { selections, extras, parts, qty: 1, productId: product.id };
    recipeSource = inventoryUsageForLine(fakeLine);
  } else {
    recipeSource = inventoryUsageForProduct(product, selections, extras);
  }
  const recipe = recipeSource.filter((item) => Number(item.qty) > 0);
  if (!recipe.length) {
    return { known: false, tone: "unknown", orderable: 0, items: [] };
  }
  const inventory = currentInventory();
  const reserved = pendingInventoryUsage();
  const items = recipe
    .map((recipeItem) => {
      const key = normalize(recipeItem.name);
      const inventoryItem = inventory.find((entry) => normalize(entry.name) === key);
      const stockQty = Number(inventoryItem?.qty) || 0;
      const reservedQty = Number(reserved.get(key)) || 0;
      const availableQty = Math.max(0, stockQty - reservedQty);
      const requiredQty = Number(recipeItem.qty) || 0;
      const portions = inventoryItem && requiredQty > 0 ? Math.floor(availableQty / requiredQty) : 0;
      return {
        name: recipeItem.name,
        unit: inventoryItem?.unit || "UND",
        stockQty,
        reservedQty,
        availableQty,
        requiredQty,
        portions,
        missing: !inventoryItem,
      };
    })
    .sort((a, b) => a.portions - b.portions);
  const orderable = Math.max(0, Math.min(...items.map((item) => item.portions)));
  const tone = orderable <= 0 ? "zero" : orderable <= 5 ? "critical" : orderable < 15 ? "low" : "ok";
  return { known: true, tone, orderable, items };
}

function buildUserStats() {
  const stats = {};
  const countedBatches = new Set();
  state.users.forEach((user) => {
    stats[user.id] = emptyStats();
  });
  state.orders.forEach((order) => {
    if (!stats[order.waiterId]) stats[order.waiterId] = emptyStats();
    stats[order.waiterId].orders += 1;
    order.commandBatches?.forEach((batch) => {
      if (countedBatches.has(batch.id)) return;
      countedBatches.add(batch.id);
      if (!stats[batch.createdBy]) stats[batch.createdBy] = emptyStats();
      stats[batch.createdBy].commands += 1;
    });
  });
  state.sales.forEach((sale) => {
    if (!stats[sale.waiterId]) stats[sale.waiterId] = emptyStats();
    if (!stats[sale.cashierId]) stats[sale.cashierId] = emptyStats();
    sale.commandBatches?.forEach((batch) => {
      if (countedBatches.has(batch.id)) return;
      countedBatches.add(batch.id);
      if (!stats[batch.createdBy]) stats[batch.createdBy] = emptyStats();
      stats[batch.createdBy].commands += 1;
    });
    stats[sale.cashierId].charges += 1;
    stats[sale.cashierId].charged += saleTotal(sale);
    stats[sale.cashierId].tips += saleTip(sale);
  });
  return stats;
}

function emptyStats() {
  return { orders: 0, commands: 0, charges: 0, charged: 0, tips: 0 };
}

function buildUserStatsForDay(day = new Date()) {
  const stats = {};
  const countedBatches = new Set();
  state.users.forEach((user) => {
    stats[user.id] = emptyStats();
  });
  state.orders.forEach((order) => {
    if (!isSameLocalDay(order.openedAt, day)) return;
    if (!stats[order.waiterId]) stats[order.waiterId] = emptyStats();
    stats[order.waiterId].orders += 1;
  });
  [...state.orders, ...state.sales].forEach((record) => {
    record.commandBatches?.forEach((batch) => {
      if (countedBatches.has(batch.id) || !isSameLocalDay(batch.createdAt, day)) return;
      countedBatches.add(batch.id);
      if (!stats[batch.createdBy]) stats[batch.createdBy] = emptyStats();
      stats[batch.createdBy].commands += 1;
    });
  });
  state.sales.forEach((sale) => {
    if (!isSameLocalDay(saleClosedAt(sale), day)) return;
    if (!stats[sale.waiterId]) stats[sale.waiterId] = emptyStats();
    if (!stats[sale.cashierId]) stats[sale.cashierId] = emptyStats();
    stats[sale.cashierId].charges += 1;
    stats[sale.cashierId].charged += saleTotal(sale);
    stats[sale.cashierId].tips += saleTip(sale);
  });
  return stats;
}

function kitchenCommands() {
  return getOpenOrders()
    .flatMap((order) =>
      (order.commandBatches || []).map((batch) => ({
        ...batch,
        status: batch.status || "new",
        orderId: order.id,
        label: orderLabel(order),
      })),
    )
    .filter((batch) => !["delivered", "cancelled"].includes(batch.status) && (batch.lines || []).length)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function updateCommandStatus(orderId, commandId, status, source) {
  const order = state.orders.find((item) => item.id === orderId);
  const batch = order?.commandBatches?.find((item) => item.id === commandId);
  if (!batch) return;
  batch.status = status;
  batch.updatedAt = new Date().toISOString();
  if (status === "preparing" && !batch.startedAt) batch.startedAt = batch.updatedAt;
  if (status === "ready" && !batch.readyAt) batch.readyAt = batch.updatedAt;
  if (status === "delivered" && !batch.deliveredAt) batch.deliveredAt = batch.updatedAt;
  batch.updatedBy = currentUser().id;
  persist();
  if (status === "ready") {
    showToast(`${orderLabel(order)} lista para entregar.`);
    celebrateAction("ready", source, "Lista");
  }
  if (status === "preparing") {
    celebrateAction("kitchen", source, "Preparando");
  }
  render();
}

function deliverReadyCommands(orderId, source) {
  const order = state.orders.find((item) => item.id === orderId && item.status === "open");
  if (!order) return;
  const batches = readyBatches(order);
  if (!batches.length) {
    showToast("No hay comandas listas para entregar en esta mesa.");
    return;
  }
  const now = new Date().toISOString();
  const total = batches.reduce((sum, batch) => sum + batchQty(batch), 0);
  batches.forEach((batch) => {
    batch.status = "delivered";
    batch.deliveredAt = now;
    batch.updatedAt = now;
    batch.updatedBy = currentUser().id;
  });
  persist();
  showToast(`${total} pieza${total === 1 ? "" : "s"} entregada${total === 1 ? "" : "s"} en ${orderLabel(order)}.`);
  celebrateAction("delivered", source, "Entregado");
  render();
}

function productCost(productId) {
  const product = getProduct(productId);
  if (!product) return 0;
  const recipeCost = productRecipeCost(product);
  return recipeCosts[productId] ?? (recipeCost || Math.round(product.price * 0.32 * 100) / 100);
}

function productRecipeCost(product) {
  const recipe = configuredRecipeForProduct(product, defaultSelectionsFor(product));
  if (!recipe.length) return 0;
  return recipeCostForItems(recipe);
}

function configuredRecipeForProduct(product, selections = defaultSelectionsFor(product)) {
  if (product?.subsection === "Pan de lena") {
    const option = product.options.find((item) => item.id === "presentacion");
    const choice = option?.choices?.[selections?.presentacion || 0]?.label || "Pieza";
    const units = choice.includes("10") ? 10 : choice.includes("5") ? 5 : 1;
    return [{ name: product.name.toUpperCase(), qty: units }];
  }
  return inventoryRecipeForSelections(product, selections);
}

function productCostSnapshot(product, selections = defaultSelectionsFor(product), extras = [], parts = null) {
  const inventory = currentInventory();
  // Cuando hay parts, generamos receta combinada ponderada para que el costo
  // congelado refleje exactamente lo que se descuenta de inventario.
  const baseRecipe = Array.isArray(parts) && parts.length >= 2
    ? combinedRecipeForLine(product, { selections, parts })
    : configuredRecipeForProduct(product, selections);
  const recipeItems = baseRecipe.map((recipeItem) => {
    const inventoryItem = inventory.find((entry) => normalize(entry.name) === normalize(recipeItem.name));
    const unitCost = Number(inventoryItem?.unitCost) || 0;
    const qty = Number(recipeItem.qty) || 0;
    return {
      itemId: inventoryItem?.id || "",
      name: recipeItem.name,
      unit: inventoryItem?.unit || recipeItem.unit || "PZ",
      qty,
      unitCost,
      total: roundCurrency(unitCost * qty),
    };
  });
  const extraItems = normalizeExtras(extras).map((extra) => ({
    extraId: extra.extraId,
    itemId: extra.itemId,
    name: extra.name,
    inventoryItemName: extra.inventoryItemName,
    unit: extra.unit,
    qty: extra.qty,
    count: extra.count,
    price: extra.price,
    unitCost: extra.unitCost,
    total: roundCurrency(extra.costTotal),
    saleTotal: roundCurrency(extra.total),
    extra: true,
  }));
  const items = [...recipeItems, ...extraItems];
  const recipeTotal = roundCurrency(recipeItems.reduce((sum, item) => sum + item.total, 0));
  const extrasTotal = roundCurrency(extraItems.reduce((sum, item) => sum + item.total, 0));
  return {
    capturedAt: new Date().toISOString(),
    recipeTotal,
    extrasTotal,
    total: roundCurrency(recipeTotal + extrasTotal),
    items,
  };
}

function lineUnitCost(line) {
  const snapshotCost = Number(line.costSnapshot?.total ?? line.unitCostSnapshot);
  if (Number.isFinite(snapshotCost) && snapshotCost >= 0) return snapshotCost;
  return productCost(line.productId) + extraUnitCostTotal(line.extras);
}

function buildBusinessMetrics(day = null) {
  const productMap = new Map();
  let revenue = 0;
  let salesGross = 0;
  let iva = 0;
  let foodCost = 0;
  let tips = 0;
  const sales = day ? state.sales.filter((sale) => isSameLocalDay(saleClosedAt(sale), day)) : state.sales;
  sales.forEach((sale) => {
    const saleGross = saleSubtotal(sale);
    const tax = saleTaxBreakdown(sale);
    salesGross += saleGross;
    iva += tax.iva;
    revenue += tax.netSubtotal;
    tips += saleTip(sale);
    sale.items?.forEach((line) => {
      const lineGross = roundCurrency(line.unitPrice * line.qty);
      const lineRevenue = taxBreakdownForGross(lineGross, tax.ivaRate).netSubtotal;
      const lineCost = lineUnitCost(line) * line.qty;
      foodCost += lineCost;
      const key = line.productId || line.name;
      const current = productMap.get(key) || { name: line.name, qty: 0, revenue: 0, cost: 0 };
      current.qty += line.qty;
      current.revenue += lineRevenue;
      current.cost += lineCost;
      productMap.set(key, current);
    });
  });
  const expenseRows = normalizeExpenses(state.expenses).filter((item) => !day || isSameLocalDay(item.createdAt, day));
  const expenses = expenseRows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paymentTotals = paymentTotalsForSales(sales);
  const cancellations = (Array.isArray(state.cancellations) ? state.cancellations : [])
    .filter((item) => !day || isSameLocalDay(item.createdAt, day));
  const cancelAmount = cancellations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const grossProfit = revenue - foodCost;
  return {
    revenue,
    salesGross,
    iva,
    collected: paymentTotals.total,
    cashRevenue: paymentTotals.cash,
    cardRevenue: paymentTotals.card,
    tips,
    foodCost,
    grossProfit,
    expenses,
    cancelAmount,
    cancelCount: cancellations.length,
    netAfterExpenses: grossProfit - expenses,
    margin: revenue ? (grossProfit / revenue) * 100 : 0,
    tickets: sales.length,
    averageTicket: sales.length ? paymentTotals.total / sales.length : 0,
    products: [...productMap.values()].sort((a, b) => b.revenue - a.revenue),
    cancellations: [...cancellations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 40),
  };
}

function exportData(kind) {
  const stamp = new Date().toISOString().slice(0, 10);
  const exporters = {
    ventas: () => ({
      filename: `librepos-ventas-${stamp}.csv`,
      rows: [
        [
          "uid",
          "id",
          "fecha",
          "orden",
          "mesero",
          "cajero",
          "metodo_pago",
          "metodo_propina",
          "subtotal_sin_iva",
          "iva",
          "consumo_con_iva",
          "propina",
          "total",
          "efectivo_a_recibir",
          "efectivo_recibido",
          "cambio",
          "productos",
        ],
        ...state.sales.map((sale) => [
          paymentUidForSale(sale),
          orderNumberLabel(sale, ""),
          formatCsvDateTime(saleClosedAt(sale)),
          sale.label || sale.orderId,
          waiterName(sale.waiterId),
          waiterName(sale.cashierId),
          sale.paymentMethod || "Efectivo",
          saleTipPaymentMethod(sale),
          saleNetSubtotal(sale),
          saleIvaAmount(sale),
          saleSubtotal(sale),
          saleTip(sale),
          saleTotal(sale),
          Number(sale.payment?.cashDue) || 0,
          Number(sale.payment?.cashReceived) || 0,
          Number(sale.payment?.changeGiven) || 0,
          (sale.items || []).map((item) => `${item.qty} x ${item.name}${item.optionsText ? ` (${item.optionsText})` : ""}`).join(" | "),
        ]),
      ],
    }),
    caja: () => ({
      filename: `librepos-caja-${stamp}.csv`,
      rows: [
        ["apertura", "cierre", "abierta_por", "cerrada_por", "fondo_inicial", "ventas_efectivo", "ventas_tarjeta", "total_ventas", "iva", "tickets_insumos", "efectivo_esperado", "efectivo_contado", "diferencia", "nota"],
        ...normalizeCashSessions(state.cashSessions).map((session) => {
          const totals = cashSessionDisplayTotals(session);
          return [
            formatCsvDateTime(session.openedAt),
            session.closedAt ? formatCsvDateTime(session.closedAt) : "Abierta",
            waiterName(session.openedBy),
            session.closedBy ? waiterName(session.closedBy) : "",
            Number(totals.openingCash) || 0,
            Number(totals.cashSales ?? totals.cash) || 0,
            Number(totals.cardSales ?? totals.card) || 0,
            Number(totals.totalSales ?? totals.total) || 0,
            Number(totals.iva) || 0,
            Number(totals.cashExpenses) || 0,
            Number(totals.expectedCash) || 0,
            Number(session.countedCash) || 0,
            Number(session.difference) || 0,
            session.closeNote || session.note || "",
          ];
        }),
      ],
    }),
    gastos: () => ({
      filename: `librepos-gastos-${stamp}.csv`,
      rows: [
        ["fecha", "proveedor", "categoria", "concepto", "importe", "origen", "caja", "insumo", "cantidad", "nota"],
        ...normalizeExpenses(state.expenses).map((expense) => [
          formatCsvDateTime(expense.createdAt),
          expense.supplier,
          expense.category,
          expense.name,
          expense.amount,
          expense.source || "",
          expense.cashSessionId || "",
          expense.inventoryItemId || "",
          expense.qty || "",
          expense.note || "",
        ]),
      ],
    }),
    inventario: () => ({
      filename: `librepos-inventario-${stamp}.csv`,
      rows: [
        ["categoria", "insumo", "proveedor", "unidad", "cantidad", "costo_unitario", "total"],
        ...currentInventory().map((item) => [item.category, item.name, item.supplier, item.unit, item.qty, item.unitCost, item.totalCost]),
      ],
    }),
    respaldo: () => ({
      filename: `librepos-respaldo-${stamp}.json`,
      text: JSON.stringify(sharedStateFromCurrent(), null, 2),
      type: "application/json;charset=utf-8",
    }),
  };
  const payload = exporters[kind]?.();
  if (!payload) return;
  downloadText(
    payload.filename,
    payload.text || csvFromRows(payload.rows),
    payload.type || "text/csv;charset=utf-8",
  );
}

function csvFromRows(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatPlainNumber(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(3)));
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "platillo";
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(String(value));
  return String(value).replace(/["\\]/g, "\\$&");
}

function formatTime(value) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSalePaymentTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Sin hora registrada";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function localDateKey(value) {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatCsvDateTime(value) {
  const date = new Date(value);
  return `${localDateKey(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function elapsed(value) {
  if (!value) return "0m";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function minutesBetween(start, end) {
  return Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function minutesSince(value) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
}

render();
initNetworkSync();
loadAccessInfo();
checkForUpdates();
window.setInterval(checkForUpdates, 10 * 60 * 1000);

// Refresca la vista de cocina cada 30s para que cronómetros y alertas estén al día.
window.setInterval(() => {
  if (!currentUser()) return;
  if (state.view !== "kitchen") return;
  if (state.modal || state.productConfig) return;
  // Solo re-renderiza si hay comandas pendientes.
  const hasActive = state.orders.some((order) =>
    (order.commandBatches || []).some((batch) => batch.status === "new" || batch.status === "preparing"),
  );
  if (hasActive) render();
}, 30000);
