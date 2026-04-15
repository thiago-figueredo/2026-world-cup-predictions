import * as tf from "@tensorflow/tfjs";

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

  async train(inputs: string[][], headers: string[], output: string[]) {
    if (inputs.length === 0) {
      throw new Error("No inputs provided");
    }

    this.populateColumnsMaps(inputs, headers);

    const inputNeurons = this.normalize(inputs);
    const normalizedInputTensor = tf.tensor2d(
      inputNeurons.map((row) => row.map((n) => n.value)),
    );

    const numberOfNeurons = normalizedInputTensor.shape[1];

    this.classLabels = [...new Set(output)];
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
      epochs: 10,
      batchSize: 20,
      shuffle: true,
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
      for (let xIndex = 0; xIndex < input.length; ++xIndex) {
        let x = input[xIndex];

        if (!this.columnsMaps.has(xIndex)) {
          this.columnsMaps.set(xIndex, {
            min: Number(x),
            max: Number(x),
            values: [x],
            columnHeader: headers[xIndex],
          });
        } else if (!this.columnsMaps.get(xIndex)!.values.includes(x)) {
          const colMin = this.columnsMaps.get(xIndex)!.min;
          const colMax = this.columnsMaps.get(xIndex)!.max;

          this.columnsMaps.get(xIndex)!.min = Math.min(colMin, Number(x));
          this.columnsMaps.get(xIndex)!.max = Math.max(colMax, Number(x));
          this.columnsMaps.get(xIndex)!.values.push(x);
          this.columnsMaps.get(xIndex)!.columnHeader = headers[xIndex];
        }
      }
    }
  }

  private isNumeric(x: string): boolean {
    return /^\d+$/.test(x);
  }
}
