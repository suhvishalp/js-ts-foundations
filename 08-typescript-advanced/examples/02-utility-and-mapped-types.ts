// Example 02 — Utility types, keyof/indexed access, mapped & conditional types
// Run: npx tsx 02-utility-and-mapped-types.ts

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// --- Built-in utility types -------------------------------------------------
type UserUpdate = Partial<User>; // all optional
type NewUser = Omit<User, "id">; // drop id
type UserPreview = Pick<User, "id" | "name">; // keep two
type UserMap = Record<number, User>; // id -> user

const update: UserUpdate = { name: "New" };
const draft: NewUser = { name: "Ada", email: "a@x.com", age: 36 };
console.log({ update, draft });

// --- ReturnType / Parameters / Awaited --------------------------------------
function createEmbedding(text: string, dims: number) {
  return { text, vector: new Array(dims).fill(0), createdAt: Date.now() };
}
type Embedding = ReturnType<typeof createEmbedding>;
type EmbedArgs = Parameters<typeof createEmbedding>; // [text: string, dims: number]

async function fetchUser(): Promise<User> {
  return { id: 1, name: "Ada", email: "a@x.com", age: 36 };
}
type Fetched = Awaited<ReturnType<typeof fetchUser>>; // User

const emb: Embedding = createEmbedding("hi", 3);
console.log("embedding:", emb.vector);

// --- keyof + indexed access -------------------------------------------------
type UserKey = keyof User; // "id" | "name" | "email" | "age"
type AgeType = User["age"]; // number
type Values = User[keyof User]; // number | string
const keys: UserKey[] = ["id", "name", "email", "age"];
console.log("keys:", keys);

// --- Mapped types (write your own) ------------------------------------------
type Nullable<T> = { [K in keyof T]: T[K] | null };
type NullableUser = Nullable<User>;
const nu: NullableUser = { id: 1, name: null, email: null, age: 36 };
console.log("nullable:", nu);

// --- Conditional types with infer -------------------------------------------
type Unwrap<T> = T extends Promise<infer R> ? R : T;
type A = Unwrap<Promise<number>>; // number
type B = Unwrap<string>; // string

type ElementType<T> = T extends (infer E)[] ? E : T;
type E1 = ElementType<number[][]>; // number[]  (one embedding)
const oneEmbedding: E1 = [0.1, 0.2];
console.log("element type demo:", oneEmbedding);

// --- Record for a vocab -----------------------------------------------------
const vocab: Record<string, number> = { the: 0, cat: 1, dog: 2 };
console.log("vocab:", vocab);
