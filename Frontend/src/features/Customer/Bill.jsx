import { useTranslation } from "react-i18next";
import { formatMoneyVND } from "../../utils/orders";

const Bill = () => {
  const { t } = useTranslation();

  return (
    <>
      <h1>{t("bill.title")}</h1>
      <div>
        {t("bill.totalAmount")}: {formatMoneyVND(123456)}
      </div>
    </>
  );
};

export default Bill;
