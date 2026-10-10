export type Scenario = "bracelet" | "books" | "cards";
export type Simulation = {
  id: string;
  scenario: Scenario;
  seed: number;
  round: number;
  cash: number;
  stock: number;
  revision: number;
  completed: boolean;
};
export type Round = {
  round: number;
  quantity: number;
  price: number;
  sold: number;
  cost: number;
  revenue: number;
  event: string;
  cash: number;
  stock: number;
};
export const scenarios = {
  bracelet: { cost: 3500, reference: 6500, demand: 9, capital: 50000 },
  books: { cost: 6000, reference: 3000, demand: 8, capital: 50000 },
  cards: { cost: 2000, reference: 4500, demand: 12, capital: 40000 },
} as const;
export function playRound(
  state: Simulation,
  quantity: number,
  price: number,
): Round {
  if (
    state.completed ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 100 ||
    !Number.isInteger(price) ||
    price < 1 ||
    price > 100000 ||
    state.seed < 0 ||
    state.seed > 1000000
  )
    throw new Error("invalid_round");
  const config = scenarios[state.scenario];
  const eventCode =
    ((state.seed * 48271 + (state.round + 1) * 69621) % 2147483647) % 5;
  const events = [
    "normal",
    "materialsRise",
    "lowDemand",
    "limitedSupply",
    "return",
  ];
  const unitCost = eventCode === 1 ? Math.ceil(config.cost * 1.2) : config.cost;
  if (eventCode === 3 && quantity > 5) throw new Error("limited_supply");
  const cost =
    quantity * unitCost + (state.scenario === "books" ? state.stock * 300 : 0);
  if (cost > state.cash) throw new Error("insufficient_cash");
  const available = state.stock + quantity;
  const demand = Math.max(
    0,
    config.demand +
      (eventCode === 2 ? -4 : 0) -
      Math.floor(Math.max(0, price - config.reference) / 1000),
  );
  let sold = Math.min(available, demand);
  if (eventCode === 4 && sold > 0) sold--;
  const revenue = sold * price;
  return {
    round: state.round + 1,
    quantity,
    price,
    sold,
    cost,
    revenue,
    event: events[eventCode],
    cash: state.cash - cost + revenue,
    stock: state.scenario === "books" ? available : available - sold,
  };
}
