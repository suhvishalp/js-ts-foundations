/**
 * Example: tensors and a tiny TensorFlow.js model.
 *
 * Install first:
 *   npm install @tensorflow/tfjs
 *
 * Run:
 *   npx tsx examples/tensorflow-intro.ts
 */
import * as tf from "@tensorflow/tfjs";

async function main() {
  // --- Part 1: tensor basics ---
  console.log("=== Tensor basics ===");
  const matrix = tf.tensor2d([[1, 2], [3, 4]]);
  console.log("shape:", matrix.shape, "dtype:", matrix.dtype); // [2,2] float32
  matrix.mul(2).print(); // element-wise: [[2,4],[6,8]]
  matrix.matMul(matrix).print(); // matrix multiply: [[7,10],[15,22]]
  matrix.dispose();

  // --- Part 2: learn y = 2x - 1 from examples ---
  console.log("\n=== Tiny linear regression (learn y = 2x - 1) ===");
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  model.compile({ loss: "meanSquaredError", optimizer: tf.train.sgd(0.01) });

  const xs = tf.tensor2d([-1, 0, 1, 2, 3, 4], [6, 1]);
  const ys = tf.tensor2d([-3, -1, 1, 3, 5, 7], [6, 1]); // y = 2x - 1

  await model.fit(xs, ys, { epochs: 200, verbose: 0 });

  const pred = model.predict(tf.tensor2d([10], [1, 1])) as tf.Tensor;
  const value = (await pred.data())[0];
  console.log(`predict(10) = ${value.toFixed(2)} (true answer: 19)`);

  // Inspect the learned weight and bias — should be ~2 and ~-1.
  const [w, b] = model.getWeights();
  console.log(`learned weight ≈ ${(await w.data())[0].toFixed(3)} (want 2)`);
  console.log(`learned bias   ≈ ${(await b.data())[0].toFixed(3)} (want -1)`);

  xs.dispose();
  ys.dispose();
  pred.dispose();
}

main().catch(console.error);
