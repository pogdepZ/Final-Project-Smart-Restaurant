import { formatMoneyVND } from "../../utils/orders";

const Bill = () => {
  return (
    <>
      <h1>Bill</h1>
      {/* Ví dụ về cách hiển thị tiền tệ */}
      <div>Tổng tiền: {formatMoneyVND(123456)}</div>
    </>
  );
};

export default Bill;
