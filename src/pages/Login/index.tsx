import { useLoginMutation } from "@/entities/Auth/api";
import { Button, message, Form } from "antd";
import { useNavigate } from "react-router-dom";
import { AntInput } from "./styled";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, isLoading } = useLoginMutation();
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    mutateAsync(values, {
      onSuccess: (data) => {
        message.success(t("login_successfully"));
        sessionStorage.setItem("token", data.token);
        navigate("/");
      },
      onError: (error: any) => {
        message.error(
          error?.response?.data?.errors?.description || t("loginFailed")
        );
      },
    });
  };

  return (
    <div className="login-page relative flex-row flex min-h-screen items-center justify-evenly gap-10 max-[1280px]:justify-center bg-[#0070FF]/10 p-5">
      <div className="w-[580px] flex flex-col items-center gap-8 z-10 max-[640px]:w-full max-[580px]:px-5">
        <p className="font-inter text-[28px] font-medium">{t("loginTitle")}</p>

        <Form
          form={form}
          name="loginForm"
          onFinish={onFinish}
          layout="vertical"
          className="w-full "
        >
          <Form.Item
            name="login"
            rules={[{ required: true, message: t("username_required") }]}
            className="mb-4"
          >
            <AntInput
              type="text"
              placeholder={t("username")}
              className="w-full px-4 py-3.5 rounded-md !bg-white border border-gray-200"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t("password_required") }]}
            className="mb-4"
          >
            <AntInput.Password
              placeholder={t("password")}
              className="light w-full px-4 py-3.5 rounded-md !bg-white border border-gray-200"
            />
          </Form.Item>

          <Form.Item className="mb-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="w-full h-[50px] bg-[#023e8a] !hover:bg-[#023e8a]/90  py-3 rounded-md"
            >
              <p className="!text-white font-inter text-lg font-medium">
                {t("enter")}
              </p>
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
