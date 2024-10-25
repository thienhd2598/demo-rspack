import React, { useEffect, useState } from "react";
import AsyncPaginate  from "react-select-async-paginate";

const SelectInfinite = (props) => {
  const loadOptions = async (searchQuery, loadedOptions, { page }) => {
    const data = await props?.getData(10, page)
    return {
      options: data,
      hasMore: data.length >= 1,
      additional: {
        page: searchQuery ? 1 : page + 1,
      },
    };
  };

  const onChange = (option) => {
    if (typeof props.onChange === "function") {
      props.onChange(option);
    }
  };

  return (
    <AsyncPaginate
      value={props.value || ""}
      loadOptions={loadOptions}
      getOptionValue={(option) => option.label}
      getOptionLabel={(option) => option.label}
      onChange={onChange}
      isDisabled={props?.disabled}
      isSearchable={false}
      isClearable={true}
      placeholder={props?.placeholder}
      additional={{
        page: 1,
      }}
    />
  );
};


export default SelectInfinite;
