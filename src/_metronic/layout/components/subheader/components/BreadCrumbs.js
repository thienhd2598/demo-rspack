/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { Link } from "react-router-dom";

export function BreadCrumbs({ items, title }) {
  if (!items || !items.length) {
    return "";
  }
  
  return (
    <ul className="breadcrumb breadcrumb-transparent font-weight-bold p-0 my-2">
      {
        items.map((item, index) => (
          [
            (!!title || index > 0) && <li key={`bc-2${index}`} className="breadcrumb-item">
              {" > "}
            </li>,
            <li key={`bc${index}`} className="breadcrumb-item">              
                <p className="text-dark mb-0" style={{fontSize: 14, fontWeight: 700 }}>
                  {item.title}
                </p>
                {/* <Link className="text-muted" to={{ pathname: item.pathname }}>
                  {item.title}
                </Link> */}
            </li>
          ]
        ))
      }
    </ul>
  );
}
