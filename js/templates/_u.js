// CSS helper: u(3) -> calc(var(--u) * 3). Keeps template CSS readable and resolution independent.
export const u = (n) => `calc(var(--u) * ${n})`;
