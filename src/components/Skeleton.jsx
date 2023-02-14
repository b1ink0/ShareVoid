import React from "react";
import "../styles/Skeleton.scss";

export default function Skeleton({
  style,
  count = 1,
  wrapper = false,
  wrapperStyle,
  styleArray = [],
}) {
  const rows = [];
  if (wrapper) {
    for (let i = 0; i < count; i++) {
      rows.push(
        <div style={wrapperStyle} key={Math.random()}>
          <div
            className={`skeleton rounded-lg fadeIn`}
            style={styleArray[i]}
          ></div>{" "}
        </div>
      );
    }
  } else {
    for (let i = 0; i < count; i++) {
      rows.push(
        <div
          className={`skeleton rounded-lg fadeIn`}
          style={style}
          key={Math.random()}
        ></div>
      );
    }
  }
  return <>{rows}</>;
}
