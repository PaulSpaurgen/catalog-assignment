"use client";

import Multiselect from "multiselect-react-dropdown";
import { useEffect, useState } from "react";
import { Asset, coinCapService } from "@/services/coinCap";

const customStyles = {
  chips: {
    background: "#4B40EE",
    marginBottom: "0px",
  },

  multiselectContainer: {
    color: "#4B40EE",
  },
  searchBox: {
    border: "none",
    borderRadius: "0px",
    padding: "0px",
  },
};
const placeholderStyle = `
      #multi_select_custom_input::placeholder {
        color: #1A243A;
        font-size: 16px;
        font-weight:500;
        opacity: 1;
      }
    `;

export default function MultiSelectWrapper({
  onSelect,
  multiSelectRef,
}: {
  onSelect: (assets: Asset[]) => void;
  multiSelectRef?: any;
}) {
  const [mounted, setMounted] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);

  useEffect(() => {
    setMounted(true);
    const style = document.createElement("style");
    style.textContent = placeholderStyle;
    document.head.appendChild(style);
    if (assets.length === 0) {
      fetchAssets();
    }

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  // Fetch assets when component mounts
  const fetchAssets = async () => {
    const data = await coinCapService.getAssets();
    setAssets(data);
  };

  const handleSelect = (selectedList: Asset[]) => {
    if (selectedList.length > 3) {
      alert(
        "You can only select up to 3 assets, Please switch to full screen mode to select more assets"
      );
      return;
    } else {
      setSelectedAssets([...selectedList]);
      onSelect(selectedList);
    }
  };

  if (!mounted)
    return <p className="text-lg font-medium text-[#1A243A]"></p>;

  return (
    <div className="relative z-10">
      <Multiselect
        ref={multiSelectRef}
        displayValue="name"
        id="multi_select_custom"
        onKeyPressFn={function noRefCheck() {}}
        onRemove={handleSelect}
        onSearch={function noRefCheck() {}}
        onSelect={handleSelect}
        options={assets}
        placeholder={!!selectedAssets.length ? "" : "Compare"}
        style={customStyles}
        selectionLimit={3}
      />
    </div>
  );
}
