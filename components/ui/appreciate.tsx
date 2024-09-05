import React, { useState } from "react";
import "../../app/messagebox.css";
interface WelcomeProps {
  initialName?: string;
  onConfirm?: () => void; // 确定按钮的回调函数
  onCancel?: () => void; // 取消按钮的回调函数
}

const Appreciate: React.FC<WelcomeProps> = ({
  initialName = "Guest",
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    // 你可以在这里添加其他逻辑，比如提交表单等
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    // 你可以在这里添加其他逻辑，比如关闭弹窗等
  };

  return (
    <div>
      <div className="message-box" onClick={handleCancel}>
        <div className="message-box-main">
          <div className="img-box">
            <img
              className="paymentCode"
              src="https://img.picgo.net/2024/09/05/paymentCodefccf61c8b93ccecd57439bc8ddd2747d.jpg"
              alt="paymentCode"
            ></img>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appreciate;
