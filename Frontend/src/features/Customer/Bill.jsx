import { formatMoneyVND } from "../../utils/orders";

const Bill = () => {
  return (
    <>
      <h1>Bill</h1>
      <div>Tổng tiền: {formatMoneyVND(123456)}</div>
    </>
  );
};

export default Bill;
