class DIContainer {
  constructor() {
    this.services = new Map();
  }

  register(name, instance) {
    this.services.set(name, instance);
  }

  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`DI service not registered: ${name}`);
    }
    return this.services.get(name);
  }
}

module.exports = new DIContainer();
