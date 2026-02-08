import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'uz' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  uz: {
    // Navigation
    'nav.dashboard': 'Bosh sahifa',
    'nav.operational': 'Operatsion modullar',
    'nav.admission': 'Qabul qilish',
    'nav.order': 'Buyurtma',
    'nav.collect': 'Buyurtmalarni yig\'ish',
    'nav.validation': 'Buyurtma tekshirish',
    'nav.return': 'Qaytarish',
    'nav.moveToRegion': 'Viloyatga ko\'chirish',
    'nav.relocation': 'ABGD zona to\'ldirish',
    'nav.history': 'Tarix',
    'nav.masterData': 'Asosiy ma\'lumotlar',
    'nav.warehouse': 'Ombor',
    'nav.employees': 'Xodimlar',
    'nav.cells': 'Yacheykalar',
    'nav.goods': 'Tovarlar',
    'nav.inventory': 'Inventarizatsiya',
    'nav.reports': 'Hisobotlar',
    'nav.bonuses': 'Bonuslar',
    
    // Common
    'common.search': 'Qidirish...',
    'common.filter': 'Filtr',
    'common.export': 'Eksport',
    'common.create': 'Yaratish',
    'common.edit': 'Tahrirlash',
    'common.delete': 'O\'chirish',
    'common.cancel': 'Bekor qilish',
    'common.confirm': 'Tasdiqlash',
    'common.save': 'Saqlash',
    'common.close': 'Yopish',
    'common.actions': 'Amallar',
    'common.status': 'Holat',
    'common.date': 'Sana',
    'common.loading': 'Yuklanmoqda...',
    'common.noData': 'Ma\'lumot topilmadi',
    'common.error': 'Xatolik yuz berdi',
    'common.success': 'Muvaffaqiyatli',
    'common.all': 'Hammasi',
    'common.syncedWithSAP': 'SAP bilan sinxronlangan',
    'common.lastUpdated': 'Oxirgi yangilanish',
    
    // Statuses
    'status.created': 'Yaratilgan',
    'status.validated': 'Tekshirilgan',
    'status.collected': 'Yig\'ilgan',
    'status.shipped': 'Yuborilgan',
    'status.approved': 'Tasdiqlangan',
    'status.rejected': 'Rad etilgan',
    'status.inProgress': 'Jarayonda',
    'status.draft': 'Qoralama',
    'status.pending': 'Kutilmoqda',
    
    // Orders
    'order.title': 'Buyurtmalar',
    'order.sapId': 'SAP ID',
    'order.customer': 'Mijoz',
    'order.items': 'Mahsulotlar',
    'order.quantity': 'Miqdor',
    'order.bindToTsd': 'TSDga bog\'lash',
    'order.totalOrders': 'Jami buyurtmalar',
    'order.pendingCollection': 'Yig\'ish kutilmoqda',
    'order.inValidation': 'Tekshiruvda',
    'order.shippedToday': 'Bugun yuborilgan',
    
    // Validation
    'validation.title': 'Buyurtma tekshirish',
    'validation.sapQty': 'SAP miqdori',
    'validation.tsdQty': 'TSD miqdori',
    'validation.discrepancy': 'Nomuvofiqlik',
    'validation.approve': 'Tasdiqlash',
    'validation.reject': 'Rad etish',
    'validation.mismatchError': 'Nomuvofiqlik xatosi',
    'validation.allMatched': 'Barcha miqdorlar mos',
    
    // Returns
    'return.title': 'Qaytarishlar',
    'return.originalOrder': 'Asl buyurtma',
    'return.condition': 'Holat',
    'return.conditionGood': 'Yaxshi',
    'return.conditionDamaged': 'Shikastlangan',
    'return.conditionQuarantine': 'Karantin',
    'return.addToStock': 'Omborga qo\'shish',
    'return.maxQtyError': 'Maksimal miqdordan oshib ketdi',
    
    // Warehouse
    'warehouse.zones': 'Zonalar',
    'warehouse.cells': 'Yacheykalar',
    'warehouse.occupancy': 'Band',
    
    // Employees
    'employee.name': 'Ism',
    'employee.role': 'Lavozim',
    'employee.uniqueId': 'ID',
    'employee.performance': 'Samaradorlik',
    
    // Inventory
    'inventory.session': 'Sessiya',
    'inventory.systemStock': 'Tizim zaxirasi',
    'inventory.physicalStock': 'Jismoniy zaxira',
    'inventory.difference': 'Farq',
    'inventory.correction': 'Tuzatish hujjati',
    
    // Errors
    'error.insufficientStock': 'Zaxira yetarli emas',
    'error.negativeBalance': 'Manfiy balans',
    'error.cannotDelete': 'O\'chirib bo\'lmaydi',
    
    // Roles
    'role.executor': 'Ijrochi',
    'role.validator': 'Tekshiruvchi',
    'role.returner': 'Qaytaruvchi',
    
    // Dialogs
    'dialog.confirmTitle': 'Tasdiqlash',
    'dialog.confirmDelete': 'Haqiqatan ham o\'chirmoqchimisiz?',
    'dialog.confirmApprove': 'Buyurtmani tasdiqlamoqchimisiz?',
    'dialog.confirmCancel': 'Bekor qilishni xohlaysizmi?',
  },
  ru: {
    // Navigation
    'nav.dashboard': 'Главная',
    'nav.operational': 'Операционные модули',
    'nav.admission': 'Приёмка',
    'nav.order': 'Заказ',
    'nav.collect': 'Сбор заказов',
    'nav.validation': 'Проверка заказа',
    'nav.return': 'Возврат',
    'nav.moveToRegion': 'Перемещение в регион',
    'nav.relocation': 'Заполнение ABGD зоны',
    'nav.history': 'История',
    'nav.masterData': 'Справочники',
    'nav.warehouse': 'Склад',
    'nav.employees': 'Сотрудники',
    'nav.cells': 'Ячейки',
    'nav.goods': 'Товары',
    'nav.inventory': 'Инвентаризация',
    'nav.reports': 'Отчёты',
    'nav.bonuses': 'Бонусы',
    
    // Common
    'common.search': 'Поиск...',
    'common.filter': 'Фильтр',
    'common.export': 'Экспорт',
    'common.create': 'Создать',
    'common.edit': 'Редактировать',
    'common.delete': 'Удалить',
    'common.cancel': 'Отмена',
    'common.confirm': 'Подтвердить',
    'common.save': 'Сохранить',
    'common.close': 'Закрыть',
    'common.actions': 'Действия',
    'common.status': 'Статус',
    'common.date': 'Дата',
    'common.loading': 'Загрузка...',
    'common.noData': 'Данные не найдены',
    'common.error': 'Произошла ошибка',
    'common.success': 'Успешно',
    'common.all': 'Все',
    'common.syncedWithSAP': 'Синхронизировано с SAP',
    'common.lastUpdated': 'Последнее обновление',
    
    // Statuses
    'status.created': 'Создан',
    'status.validated': 'Проверено',
    'status.collected': 'Собрано',
    'status.shipped': 'Отгружено',
    'status.approved': 'Одобрено',
    'status.rejected': 'Отклонено',
    'status.inProgress': 'В процессе',
    'status.draft': 'Черновик',
    'status.pending': 'Ожидание',
    
    // Orders
    'order.title': 'Заказы',
    'order.sapId': 'SAP ID',
    'order.customer': 'Клиент',
    'order.items': 'Товары',
    'order.quantity': 'Количество',
    'order.bindToTsd': 'Привязать к ТСД',
    'order.totalOrders': 'Всего заказов',
    'order.pendingCollection': 'Ожидают сбора',
    'order.inValidation': 'На проверке',
    'order.shippedToday': 'Отгружено сегодня',
    
    // Validation
    'validation.title': 'Проверка заказа',
    'validation.sapQty': 'Количество SAP',
    'validation.tsdQty': 'Количество ТСД',
    'validation.discrepancy': 'Расхождение',
    'validation.approve': 'Одобрить',
    'validation.reject': 'Отклонить',
    'validation.mismatchError': 'Ошибка несоответствия',
    'validation.allMatched': 'Все количества совпадают',
    
    // Returns
    'return.title': 'Возвраты',
    'return.originalOrder': 'Исходный заказ',
    'return.condition': 'Состояние',
    'return.conditionGood': 'Хорошее',
    'return.conditionDamaged': 'Повреждено',
    'return.conditionQuarantine': 'Карантин',
    'return.addToStock': 'Добавить на склад',
    'return.maxQtyError': 'Превышено максимальное количество',
    
    // Warehouse
    'warehouse.zones': 'Зоны',
    'warehouse.cells': 'Ячейки',
    'warehouse.occupancy': 'Занятость',
    
    // Employees
    'employee.name': 'Имя',
    'employee.role': 'Должность',
    'employee.uniqueId': 'ID',
    'employee.performance': 'Производительность',
    
    // Inventory
    'inventory.session': 'Сессия',
    'inventory.systemStock': 'Системный остаток',
    'inventory.physicalStock': 'Физический остаток',
    'inventory.difference': 'Разница',
    'inventory.correction': 'Корректировочный документ',
    
    // Errors
    'error.insufficientStock': 'Недостаточно запаса',
    'error.negativeBalance': 'Отрицательный баланс',
    'error.cannotDelete': 'Удаление невозможно',
    
    // Roles
    'role.executor': 'Исполнитель',
    'role.validator': 'Проверяющий',
    'role.returner': 'Возвратчик',
    
    // Dialogs
    'dialog.confirmTitle': 'Подтверждение',
    'dialog.confirmDelete': 'Вы уверены, что хотите удалить?',
    'dialog.confirmApprove': 'Подтвердить заказ?',
    'dialog.confirmCancel': 'Отменить действие?',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('wms-language');
    return (saved as Language) || 'ru';
  });

  useEffect(() => {
    localStorage.setItem('wms-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
