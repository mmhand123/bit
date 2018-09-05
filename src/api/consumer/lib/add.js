/** @flow */
import path from 'path';
import type { PathOsBased } from '../../../utils/path';
import AddComponents from '../../../consumer/component-ops/add-components';
import type {
  AddProps,
  AddActionResults,
  PathOrDSL
} from '../../../consumer/component-ops/add-components/add-components';
import { loadConsumer, Consumer } from '../../../consumer';

export async function addOne(addProps: AddProps): Promise<AddActionResults> {
  const consumer: Consumer = await loadConsumer();
  const addComponents = new AddComponents(consumer, addProps);
  const addResults = await addComponents.add();
  await consumer.onDestroy();
  return addResults;
}

export async function addMany(components: AddProps[]): Promise<AddActionResults[]> {
  const consumer: Consumer = await loadConsumer();
  const addComponentsArr = [];
  components.forEach((componentDefinition) => {
    const normalizedPaths: PathOsBased[] = componentDefinition.componentPaths.map((p) => {
      return path.normalize(p);
    });
    componentDefinition.componentPaths = normalizedPaths;
    const normalizedTests: PathOrDSL[] = componentDefinition.tests
      ? componentDefinition.tests.map(testFile => path.normalize(testFile.trim()))
      : [];
    componentDefinition.tests = normalizedTests;
    componentDefinition.exclude = componentDefinition.exclude
      ? componentDefinition.exclude.map(excludeFile => path.normalize(excludeFile.trim()))
      : [];
    const addComponents = new AddComponents(consumer, componentDefinition);
    addComponentsArr.push(addComponents);
  });
  const addResults = [];
  await Promise.all(
    addComponentsArr.map(async function (addComponents) {
      const addResultsSingle = await addComponents.add();
      addResults.push(addResultsSingle);
    })
  );
  await consumer.onDestroy();
  return addResults;
}
