import * as tf from "@tensorflow/tfjs";
import fs from "fs";
import path from "path";

type Column = number;

type Value = {
  min: number;
  max: number;
  values: string[];
  columnHeader: string;
};

type Neuron = { header: string; value: number };

export class Model {
  private columnsMaps = new Map<Column, Value>();
  private model: tf.Sequential;
  classLabels: string[] = [];

  constructor() {
    this.model = tf.sequential();
  }

  static exists(dir: string) {
    return fs.existsSync(path.join(dir, "model.json"));
  }

  static async load(dir: string) {
    const instance = new Model();
    const { modelTopology, weightSpecs } = JSON.parse(
      fs.readFileSync(path.join(dir, "model.json"), "utf-8"),
    );

    const buf = fs.readFileSync(path.join(dir, "weights.bin"));

    const weightData = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    );

    instance.model = (await tf.loadLayersModel(
      tf.io.fromMemory(modelTopology, weightSpecs, weightData),
    )) as tf.Sequential;

    const meta = JSON.parse(
      fs.readFileSync(path.join(dir, "metadata.json"), "utf-8"),
    );

    instance.classLabels = meta.classLabels;
    instance.columnsMaps = new Map(meta.columnsMaps);

    return instance;
  }

  async save(dir: string) {
    fs.mkdirSync(dir, { recursive: true });
    await this.model.save(
      tf.io.withSaveHandler(async (artifacts) => {
        fs.writeFileSync(
          path.join(dir, "model.json"),
          JSON.stringify({
            modelTopology: artifacts.modelTopology,
            weightSpecs: artifacts.weightSpecs,
          }),
        );
        if (artifacts.weightData) {
          const data =
            artifacts.weightData instanceof ArrayBuffer
              ? artifacts.weightData
              : artifacts.weightData[0];
          fs.writeFileSync(path.join(dir, "weights.bin"), Buffer.from(data));
        }
        return {
          modelArtifactsInfo: {
            dateSaved: new Date(),
            modelTopologyType: "JSON" as const,
          },
        };
      }),
    );
    fs.writeFileSync(
      path.join(dir, "metadata.json"),
      JSON.stringify({
        columnsMaps: Array.from(this.columnsMaps.entries()),
        classLabels: this.classLabels,
      }),
    );
  }

  async train(
    inputs: string[][],
    headers: string[],
    output: string[],
    classLabels?: string[],
  ) {
    if (inputs.length === 0) {
      throw new Error("No inputs provided");
    }

    this.populateColumnsMaps(inputs, headers);

    const inputNeurons = this.normalize(inputs);
    const normalizedInputTensor = tf.tensor2d(
      inputNeurons.map((row) => row.map((n) => n.value)),
    );

    const numberOfNeurons = normalizedInputTensor.shape[1];

    this.classLabels = classLabels ?? [...new Set(output)];
    const numClasses = this.classLabels.length;

    this.model.add(
      tf.layers.dense({
        inputShape: [numberOfNeurons],
        units: numberOfNeurons,
        activation: "relu",
      }),
    );

    this.model.add(
      tf.layers.dense({
        inputShape: [numberOfNeurons],
        units: numberOfNeurons * 2,
        activation: "relu",
      }),
    );

    this.model.add(
      tf.layers.dense({
        units: numClasses,
        activation: "softmax",
      }),
    );

    this.model.compile({
      optimizer: "adam",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    const oneHot = output.map((o) =>
      this.classLabels.map((u) => (u === o ? 1 : 0)),
    );

    const outputTensor = tf.tensor2d(oneHot);

    return await this.model.fit(normalizedInputTensor, outputTensor, {
      epochs: 4,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          const toPercent = (value?: number) =>
            `${(value ?? 0 * 100).toFixed(2)}%`;

          console.log(`Epoch ${epoch}: loss: ${toPercent(logs?.loss)}`);
        },
      },
    });
  }

  async predict(input: string[]): Promise<number[]> {
    const inputNeurons = this.normalize([input]);
    const normalizedInputTensor = tf.tensor2d(
      inputNeurons.map((row) => row.map((n) => n.value)),
    );

    const prediction = this.model.predict(normalizedInputTensor) as tf.Tensor;
    const [probabilities] = (await prediction.array()) as number[][];
    return probabilities;
  }

  private normalize(inputs: string[][]) {
    let newInputs: Neuron[][] = Array.from({ length: inputs.length }, () =>
      Array(inputs[0].length).fill({ header: "", value: -1 }),
    );

    for (let row = 0; row < inputs.length; ++row) {
      const input = inputs[row];

      for (let col = 0; col < input.length; ++col) {
        const x = input[col];
        const columnHeader = this.columnsMaps.get(col)!.columnHeader;
        let normalizedValue = -1;

        if (this.isNumeric(x)) {
          const xValue = Number(x);
          const colMin = this.columnsMaps.get(col)?.min ?? 0;
          const colMax = this.columnsMaps.get(col)?.max ?? 0;

          normalizedValue =
            colMax === colMin ? 0 : (xValue - colMin) / (colMax - colMin);

          newInputs[row][col] = {
            header: columnHeader,
            value: normalizedValue,
          };

          continue;
        }

        const columnValues = this.columnsMaps.get(col)!;
        const newColumnValues = columnValues.values.map((val, index) => {
          return {
            header: `${columnHeader}: ${columnValues.values[index]}`,
            value: val === x ? 1 : 0,
          };
        });

        newInputs[row].splice(col, 0, ...newColumnValues);
      }
    }

    return newInputs.map((row) => row.filter((neuron) => neuron.value >= 0));
  }

  private populateColumnsMaps(inputs: string[][], headers: string[]) {
    for (const input of inputs) {
      for (let i = 0; i < input.length; ++i) {
        const x = input[i];
        const col = this.columnsMaps.get(i);
        if (!col) {
          this.columnsMaps.set(i, {
            min: Number(x),
            max: Number(x),
            values: [x],
            columnHeader: headers[i],
          });
        } else if (!col.values.includes(x)) {
          col.min = Math.min(col.min, Number(x));
          col.max = Math.max(col.max, Number(x));
          col.values.push(x);
          col.columnHeader = headers[i];
        }
      }
    }
  }

  private isNumeric(x: string): boolean {
    return /^\d+$/.test(x);
  }
}
