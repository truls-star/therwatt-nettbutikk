
window.THERWATT_CONFIG = {
  currency: "NOK",
  vatRate: 0.25,
  defaultGroupDiscount: 0,
  groupDiscounts: {
    "VARMEPUMPER": 0.00
  },
  productDiscounts: {
    "8421881": 0.00
  },
  requestThresholdInclVat: 50000,
  supportEmail: "post@therwatt.no",
  supportPhone: "+47 00 00 00 00",
  stripeEnabled: true
};

window.TherwattPricing = {
  getDiscount(product) {
    const cfg = window.THERWATT_CONFIG;
    if (cfg.productDiscounts && Object.prototype.hasOwnProperty.call(cfg.productDiscounts, product.sku)) {
      return Number(cfg.productDiscounts[product.sku]) || 0;
    }
    if (cfg.groupDiscounts && Object.prototype.hasOwnProperty.call(cfg.groupDiscounts, product.group_name)) {
      return Number(cfg.groupDiscounts[product.group_name]) || 0;
    }
    return Number(cfg.defaultGroupDiscount) || 0;
  },
  priceInclVat(product) {
    const cfg = window.THERWATT_CONFIG;
    const discount = this.getDiscount(product);
    return product.gross_price * (1 - discount) * (1 + cfg.vatRate);
  },
  isRequestOnly(product) {
    return this.priceInclVat(product) >= window.THERWATT_CONFIG.requestThresholdInclVat;
  }
};
