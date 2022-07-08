import { CSSProperties } from 'react';

import { ElementState } from 'app/features/canvas/runtime/element';
import { FrameState } from 'app/features/canvas/runtime/frame';
import { RootElement } from 'app/features/canvas/runtime/root';

import { DragNode, DropNode } from './types';

export interface TreeElement {
  key: number;
  title: string;
  selectable?: boolean;
  children?: TreeElement[];
  dataRef: ElementState | FrameState;
  style?: CSSProperties;
}

export function getTreeData(root?: RootElement | FrameState, selection?: string[], selectedColor?: string) {
  let elements: TreeElement[] = [];
  if (root) {
    for (let i = root.elements.length; i--; i >= 0) {
      const item = root.elements[i];
      const element: TreeElement = {
        key: item.UID,
        title: item.getName(),
        selectable: true,
        dataRef: item,
      };

      const isSelected = isItemSelected(item, selection);
      if (isSelected) {
        element.style = { backgroundColor: selectedColor };
      }

      if (item instanceof FrameState) {
        element.children = getTreeData(item, selection, selectedColor);
      }
      elements.push(element);
    }
  }

  return elements;
}

function isItemSelected(item: ElementState, selection: string[] | undefined) {
  return Boolean(selection?.includes(item.getName()));
}

export function onNodeDrop(
  info: { node: DropNode; dragNode: DragNode; dropPosition: number; dropToGap: boolean },
  treeData: TreeElement[]
) {
  const destKey = info.node.key;
  const srcKey = info.dragNode.key;
  const destPos = info.node.pos.split('-');
  const destPosition = info.dropPosition - Number(destPos[destPos.length - 1]);

  const loop = (
    data: TreeElement[],
    key: number,
    callback: { (item: TreeElement, index: number, arr: TreeElement[]): void }
  ) => {
    data.forEach((item, index, arr) => {
      if (item.key === key) {
        callback(item, index, arr);
        return;
      }
      if (item.children) {
        loop(item.children, key, callback);
      }
    });
  };
  const data = [...treeData];

  // Find dragObject
  let srcElement: TreeElement;
  loop(data, srcKey, (item: TreeElement, index: number, arr: TreeElement[]) => {
    arr.splice(index, 1);
    srcElement = item;
  });

  if (destPosition === 0) {
    // Drop on the content
    loop(data, destKey, (item: TreeElement) => {
      item.children = item.children || [];
      item.children.unshift(srcElement);
    });
  } else {
    // Drop on the gap (insert before or insert after)
    let ar;
    let i: number;
    loop(data, destKey, (item: TreeElement, index: number, arr: TreeElement[]) => {
      ar = arr;
      i = index;
    });

    if (destPosition === -1) {
      // @ts-ignore
      ar.splice(i, 0, srcElement);
    } else {
      // @ts-ignore
      ar.splice(i + 1, 0, srcElement);
    }
  }

  return data;
}
