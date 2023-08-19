import dayjs from "https://cdn.jsdelivr.net/npm/dayjs@1/+esm";

export function describePass(pass) {
  return `${pass.num_days} day(s), ${pass.price} NTD`;
}

export function formatDate(date, format = "D MMM YYYY") {
  if (!date) return "";

  return dayjs(date).format(format);
}

export function installGlobally() {
  const functions = [describePass, formatDate];
  for (const func of functions) {
    window[func.name] = func;
  }
}
