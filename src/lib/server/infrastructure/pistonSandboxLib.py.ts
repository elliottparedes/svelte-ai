/** Python helpers injected as inkstream_sandbox.py on every execute_python run. */
export const INKSTREAM_SANDBOX_PY = String.raw`"""Inkstream pandas helpers — use instead of raw pd.read_csv for attachments."""
from __future__ import annotations
import os
import pandas as pd

_NUM_HINTS = ("Data.", "Precipitation", "Temp", "Speed", "Price", "Amount", "Count", "Value")


def _coerce_numeric(df: pd.DataFrame) -> pd.DataFrame:
    for c in df.columns:
        if any(h in c for h in _NUM_HINTS):
            df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def read_csv(path: str) -> pd.DataFrame:
    return _coerce_numeric(pd.read_csv(path))


def show(obj, max_rows: int = 25) -> None:
    if isinstance(obj, pd.DataFrame):
        print(obj.head(max_rows).to_string())
        if len(obj) > max_rows:
            print(f"... ({len(obj)} rows total; showing {max_rows})")
    elif isinstance(obj, pd.Series):
        print(obj.head(max_rows).to_string())
    else:
        print(obj)


def profile(path: str) -> pd.DataFrame:
    df = read_csv(path)
    print("=" * 44)
    print(f"FILE: {path}")
    print(f"shape: {df.shape[0]} rows x {df.shape[1]} cols")
    print("columns:", list(df.columns))
    for date_col in ("Date.Full", "date", "Date"):
        if date_col in df.columns:
            print(f"date range: {df[date_col].min()} -> {df[date_col].max()}")
            break
    print("-" * 44)
    print(df.dtypes.to_string())
    num = df.select_dtypes(include="number")
    if not num.empty:
        print("-" * 44)
        print(num.describe().transpose().head(24).to_string())
    print("=" * 44)
    return df


def group_means(
    df: pd.DataFrame,
    by: str,
    cols: list,
    top: int = 20,
    ascending: bool = False,
    sort_col: str | None = None,
) -> None:
    missing = [c for c in [by, *cols] if c not in df.columns]
    if missing:
        print("missing columns:", missing)
        print("available:", list(df.columns))
        return
    g = df.groupby(by)[cols].mean(numeric_only=True).round(2)
    if isinstance(g, pd.Series):
        g = g.to_frame(name=cols[0])
    key = sort_col or cols[0]
    print(g.sort_values(key, ascending=ascending).head(top).to_string())


def preloaded_banner(files: list[str]) -> None:
    missing = [f for f in files if not os.path.isfile(f)]
    if missing:
        print("[sandbox] missing:", ", ".join(missing))
        print("[sandbox] cwd:", os.listdir("."))
    else:
        print("[sandbox] preloaded:", ", ".join(files))


inkstream_read_csv = read_csv
inkstream_show = show
inkstream_profile = profile
inkstream_group_means = group_means
`;
