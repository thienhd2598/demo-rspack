import { KonvaEventObject, Node, NodeConfig } from "konva/lib/Node";
import { useState } from "react";
import useTransformer from "./useTransformer";

const useSelection = (transformer) => {
  const [selectedItems, setSelectedItems] = useState([]);

  
  const onSelectItem = (e, itemList) => {        
    if (transformer === undefined || transformer === null) {
      console.error("transformer is not given");
      return;
    }
    if (!transformer.transformerRef.current) {
      return;
    }
    if (itemList) {
      transformer.transformerRef.current.nodes(itemList);
      transformer.setTransformerConfig(transformer.transformerRef.current);
      setSelectedItems(itemList);
      return;
    }
    if (!e) {
      return;
    }
    if (e.target.attrs[`data-item-type`] === "frame") {
      transformer.transformerRef.current.nodes([]);
      transformer.setTransformerConfig(transformer.transformerRef.current);
      setSelectedItems([]);
      return;
    }
    let newItemList = [];
    const targetItem
      = e.target.name() === "label-text"
        ? e.target.getParent().getParent().findOne(".label-target")
        : e.target;
    if (!e.evt.shiftKey) {
      newItemList = [targetItem];
    } else if (selectedItems.find((item) => item.id() === targetItem.id())) {
      newItemList = selectedItems.filter((item) => item.id() !== targetItem.id());
    } else {
      newItemList = [...selectedItems, targetItem];
    }
    transformer.transformerRef.current.nodes(newItemList);
    transformer.setTransformerConfig(transformer.transformerRef.current);
    setSelectedItems(newItemList);
  };

  const clearSelection = () => {
    if (transformer.transformerRef.current) {
      transformer.transformerRef.current.nodes([]);
      transformer.setTransformerConfig(transformer.transformerRef.current);
    }
    setSelectedItems([]);
  };

  return {
    selectedItems,
    setSelectedItems,
    onSelectItem,
    clearSelection,
  };
};

export default useSelection;
