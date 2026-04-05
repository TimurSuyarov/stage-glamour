import { useLoginMutation } from "@/entities/Auth/api";
import { useAuth, userFromEmployee } from "@/contexts/AuthContext";
import { setStoredAuth, type LoginResponse } from "@/lib/authStorage";
import { Button, message, Form } from "antd";
import { useNavigate } from "react-router-dom";
import { AntInput } from "./styled";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

const NAV_ITEMS_UZ = [
  "Qabul qilish",
  "ABGD zona to'ldirish",
  "Kerakli tovar ko'chirish",
  "Buyurtmalarni yig'ish",
  "Buyurtma tekshirish",
  "Viloyatga ko'chirish",
  "Qaytarish",
  "Tarix",
];

const NAV_ITEMS_RU = [
  "Приёмка",
  "Заполнение ABGD зоны",
  "Требуемое перемещение",
  "Сбор заказов",
  "Проверка заказа",
  "Перемещение в регион",
  "Возврат",
  "История",
];

const TABLE_ROWS_UZ = [
  { num: "180", name: "NAVRO'Z BOZOR SADIYA BARAKAT MCHJ" },
  { num: "179", name: "OSDO (Diller)" },
  { num: "178", name: "BEK BARAKA BOZOR 0/741" },
  { num: "177", name: "BUXORO (Diller)" },
  { num: "114", name: "NAMANGAN (Diller)" },
];

const TABLE_ROWS_RU = [
  { num: "180", name: "НАВРУЗ БАЗАР САДИЯ БАРАКАТ ООО" },
  { num: "179", name: "ОСДО (Дилер)" },
  { num: "178", name: "БЕК БАРАКА БАЗАР 0/741" },
  { num: "177", name: "БУХАРА (Дилер)" },
  { num: "114", name: "НАМАНГАН (Дилер)" },
];

const SkeletonBar = () => (
  <div className="h-3 bg-gray-300 rounded-sm animate-pulse" style={{ width: "70%" }} />
);

const AppMockup = ({ lang }: { lang: "uz" | "ru" }) => {
  const navItems = lang === "uz" ? NAV_ITEMS_UZ : NAV_ITEMS_RU;
  const tableRows = lang === "uz" ? TABLE_ROWS_UZ : TABLE_ROWS_RU;
  const title = lang === "uz" ? "ABGD zona to'ldirish" : "Заполнение ABGD зоны";
  const breadcrumb =
    lang === "uz"
      ? "Operatsion modullar › ABGD zona to'ldirish"
      : "Операционные модули › Заполнение ABGD зоны";
  const docLabel = lang === "uz" ? "Hujjat raqami" : "Номер документа";
  const clientLabel = lang === "uz" ? "Mijoz nomi" : "Имя клиента";

  return (
    <div className="rounded-l-xl overflow-hidden border border-white/10 shadow-2xl text-[11px] ">
      {/* Title bar */}
      <div className="bg-[#1e293b] px-4 py-2.5 flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-2 flex-1 h-1.5 rounded-full bg-white/10" />
      </div>

      {/* App UI */}
      <div className="flex" style={{ height: 500 }}>
        {/* Sidebar — dark */}
        <div className="w-44 bg-[#0f172a] border-r border-white/10 flex flex-col flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
            <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
              <div className="w-2.5 h-2.5 bg-white/80 rounded-sm" />
            </div>
            <div>
              <div className="text-white font-bold leading-none text-[10px]">Glamour</div>
              <div className="text-white/40 text-[8px] leading-none mt-0.5">WMS ADMIN</div>
            </div>
          </div>

          {/* Nav items with bigger padding */}
          <div className="flex flex-col py-1.5 overflow-hidden">
            {navItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2.5 ${i === 1 ? "bg-primary/20 text-primary" : "text-white/40"
                  }`}
              >
                <div
                  className={`w-2 h-2 rounded-sm flex-shrink-0 ${i === 1 ? "bg-primary" : "bg-white/20"
                    }`}
                />
                <span className="truncate leading-none">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content — white/light like real app */}
        <div className="flex-1 bg-[#f8fafc] p-3 flex flex-col gap-2 overflow-hidden">
          <div className="text-gray-400 text-[9px]">{breadcrumb}</div>
          <div className="text-gray-800 font-semibold text-[13px]">{title}</div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="flex-1 h-6 bg-white rounded border border-gray-200 px-2 flex items-center shadow-sm">
              <span className="text-gray-400 text-[9px]">{docLabel}</span>
            </div>
            <div className="flex-1 h-6 bg-white rounded border border-gray-200 px-2 flex items-center shadow-sm">
              <span className="text-gray-400 text-[9px]">{clientLabel}</span>
            </div>
          </div>

          {/* Table — white background */}
          <div className="flex-1 overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex bg-gray-50 border-b border-gray-200">
              <div className="w-5 flex-shrink-0 p-1.5" />
              <div className="w-16 p-1.5 text-gray-500 font-semibold">{docLabel.split(" ")[0]}</div>
              <div className="flex-1 p-1.5 text-gray-500 font-semibold">{clientLabel}</div>
            </div>
            {tableRows.map((row, i) => (
              <div key={i} className="flex border-b border-gray-100 last:border-0">
                <div className="w-5 flex-shrink-0 p-1.5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm border border-gray-300" />
                </div>
                <div className="w-16 p-1.5 text-gray-600">{row.num}</div>
                <div className="flex-1 p-1.5 flex items-center">
                  <SkeletonBar />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { mutateAsync, isLoading } = useLoginMutation();
  const [form] = Form.useForm();
  const { currentLanguage, changeLanguage } = useLanguage();

  const onFinish = (values: any) => {
    mutateAsync(values, {
      onSuccess: (data: LoginResponse) => {
        message.success(t("login_successfully"));
        setStoredAuth(data.token, data.refreshToken, data.employee);
        setUser(userFromEmployee(data.employee));
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
    <div className="flex min-h-screen">
      {/* Left – Form panel */}
      <div className="relative w-full md:w-1/2 flex flex-col bg-white px-8 py-8 flex-shrink-0">
        {/* Language switcher */}
        <div className="flex justify-end gap-2">
          {(["uz", "ru"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => changeLanguage(lang)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md border transition-colors ${currentLanguage === lang
                  ? "bg-primary text-white border-primary"
                  : "bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Center content — max width so inputs don't stretch full panel */}
        <div className="flex-1 flex flex-col justify-center py-10">
          <div className="w-full max-w-sm ml-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-md">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-6 h-6 text-white"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <p className="font-bold text-xl leading-none text-gray-900">Glamour</p>
                <p className="text-xs text-gray-400 leading-none mt-1">WMS ADMIN</p>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("loginTitle")}</h1>
            <p className="text-gray-500 text-sm mb-8">{t("loginSubtitle")}</p>

            <Form form={form} name="loginForm" onFinish={onFinish} layout="vertical">
              <Form.Item
                name="login"
                rules={[{ required: true, message: t("username_required") }]}
                className="mb-4"
              >
                <AntInput
                  placeholder={t("username")}
                  className="w-full h-11 rounded-lg border-gray-200"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: t("password_required") }]}
                className="mb-6"
              >
                <AntInput.Password
                  placeholder={t("password")}
                  className="w-full h-11 rounded-lg border-gray-200"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  className="w-full h-11 rounded-lg text-base font-medium"
                >
                  {t("enter")}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>

      {/* Right – Dark showcase panel */}
      <div className="hidden md:flex md:w-1/2 bg-[#0f172a] flex-col justify-center overflow-hidden">
        {/* Text section */}
        <div className="pl-12 pr-6 mb-8 flex-shrink-0">
          <h2 className="text-white text-3xl font-bold mb-2">
            {t("loginWelcomeTitle")}
          </h2>
          <p className="text-slate-400 text-sm">{t("loginWelcomeDesc")}</p>
        </div>

        {/* Mockups */}
        <div className="relative pl-12 pr-0 flex-shrink-0 overflow-hidden" style={{ height: 460 }}>
          {/* Back mockup */}
          <div
            className="absolute top-0"
            style={{
              left: 48,
              right: -32,
              transform: "translateY(20px) scale(0.93)",
              transformOrigin: "top left",
              opacity: 0.45,
            }}
          >
            <AppMockup lang={currentLanguage === "ru" ? "uz" : "ru"} />
          </div>

          {/* Front mockup */}
          <div
            className="absolute top-8"
            style={{ left: 48, right: -32, zIndex: 1 }}
          >
            <AppMockup lang={currentLanguage} />
          </div>

          {/* Fade bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, #0f172a)", zIndex: 2 }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
