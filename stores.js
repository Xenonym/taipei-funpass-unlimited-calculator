function getChoicesData() {
  return fetch("./data/choices.json").then((response) => response.json());
}
const choices = {
  all: [],
  types: [],
  last_updated: null,
  async init() {
    const data = await getChoicesData();
    this.all = data.choices.sort((c1, c2) => c2.Price - c1.Price);
    this.types = [...new Set(data.choices.map((c) => c.Type))].sort();
    this.last_updated = new Date(Date.parse(data.last_updated));
  },
  getChoice(name) {
    return this.all.find((choice) => choice.Choice === name);
  },
  getChoices(names) {
    return this.all.filter((choice) =>
      names.some((name) => choice.Choice === name),
    );
  },
  getChoicesWithType(type) {
    return this.all.filter((choice) => choice.Type === type);
  },
  getTopChoicesWithType(type, numChoices) {
    return this.getChoicesWithType(type)
      .toSorted((c1, c2) => c2.Price - c1.Price)
      .slice(0, numChoices);
  },
  getTopChoices(numChoices) {
    return [
      ...this.getTopChoicesWithType("Cultural Experience", 1),
      ...this.getTopChoicesWithType("Attraction", numChoices - 1),
    ];
  },
  filterChoices(types, search) {
    return this.all.filter(
      (choice) =>
        types.some((t) => t === choice.Type) &&
        choice.Choice.toLowerCase().includes(search.toLowerCase()),
    );
  },
};

function getPassesData() {
  return fetch("./data/passes.json").then((response) => response.json());
}
const passes = {
  all: [],
  types: [],
  last_updated: null,
  async init() {
    const data = await getPassesData();
    this.all = data.passes;
    this.types = data.pass_types;
    this.last_updated = new Date(Date.parse(data.last_updated));
  },
  getPass(type, numDays) {
    return this.all.find((p) => p.type === type && p.num_days === numDays);
  },
  getPassesOfType(type) {
    return this.all.filter((p) => p.type === type);
  },
};

const DEFAULT_ESTIMATES = Object.freeze({
  activities: { count: 3 },
  transport: {
    mrt: { count: 3, cost: 30 },
    bus: { count: 2, cost: 15 },
    shuttle: { count: 2, cost: 50 },
  },
});

const parameters = {
  activities: [],
  estimates: {},
  suggestedPass: {},
  transportCost: 0,
  passSavings: 0,
  init() {
    this.resetEstimates();

    // Update values any time estimates are updated
    Alpine.effect(() => {
      // Get the number of days required for the number of activities selected
      const suggestedPassDays = Math.ceil(
        this.activities.length / this.estimates.activities.count,
      );
      this.suggestedPass = passes.getPass(
        "Unlimited",
        Math.min(suggestedPassDays, 3),
      );

      // Clear estimates if no pass is selected
      if (!this.suggestedPass) {
        this.transportCost = 0;
        this.passSavings = 0;
        return;
      }

      // Remove activities if maximum number of activities (no of pass days * no of activities per day)
      // is less than the number of activities already selected
      this.activities = this.activities.splice(
        0,
        this.estimates.activities.count * this.suggestedPass.num_days,
      );

      const transport = this.estimates.transport;
      this.transportCost = transport.mrt.count * transport.mrt.cost;
      this.transportCost += transport.bus.count * transport.bus.cost;
      this.transportCost *= this.suggestedPass.num_days;
      this.transportCost += transport.shuttle.count * transport.shuttle.cost;

      this.passSavings =
        this.getTotalActivityPrice() +
        this.transportCost -
        this.suggestedPass.price;
    });
  },
  getActivitiesInfo() {
    return choices.getChoices(this.activities);
  },
  getActivitiesWithType(type) {
    return this.getActivitiesInfo()
      .filter((act) => act.Type === type)
      .map((act) => act.Choice);
  },
  getTotalActivityPrice() {
    return this.getActivitiesInfo().reduce(
      (total, current) => total + current.Price,
      0,
    );
  },
  clearActivities() {
    this.activities = [];
  },
  resetEstimates() {
    this.estimates = this.getDefaultEstimates();
  },
  getDefaultEstimates() {
    return structuredClone(DEFAULT_ESTIMATES);
  },
};

export default function createStores() {
  document.addEventListener("alpine:init", () => {
    Alpine.store("parameters", parameters);
    Alpine.store("choices", choices);
    Alpine.store("passes", passes);
  });
}
