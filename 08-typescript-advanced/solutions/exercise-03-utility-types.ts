// Exercise 3 — Deriving related types with utility types
// Run: npx tsx exercise-03-utility-types.ts

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Omit: a "create" payload has no server-generated id.
type NewUser = Omit<User, "id">;

// Partial: an update touches any subset of fields.
type UserUpdate = Partial<User>;

// Pick: a lightweight preview.
type UserPreview = Pick<User, "id" | "name">;

// Record: an id -> user lookup table.
type UserMap = Record<number, User>;

// Immutable merge — note the derived types keep everything in sync with User.
function applyUpdate(user: User, update: UserUpdate): User {
  return { ...user, ...update };
}

// --- Demo -------------------------------------------------------------------
const draft: NewUser = { name: "Ada", email: "ada@x.com", age: 36 };
const created: User = { id: 1, ...draft };

const updated = applyUpdate(created, { age: 37 }); // only change age
console.log(updated); // { id: 1, name: 'Ada', email: 'ada@x.com', age: 37 }

const preview: UserPreview = { id: created.id, name: created.name };
console.log(preview);

const byId: UserMap = { 1: created };
console.log(byId[1].email);

export { User, NewUser, UserUpdate, UserPreview, UserMap, applyUpdate };
