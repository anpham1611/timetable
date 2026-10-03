import { getAdminEmail } from "@/lib/adminEmail";

const DISCLAIMER =
  "Dữ liệu tổng hợp từ file thời khóa biểu Excel của trường. Có sai sót xin báo lại phòng đào tạo.";

export function Footer() {
  const adminEmail = getAdminEmail();

  return (
    <footer className="mx-auto max-w-md px-6 py-6 text-center text-xs text-muted-foreground print:text-black">
      <p>{DISCLAIMER}</p>
      <p className="mt-1">
        <a
          href={`mailto:${adminEmail}`}
          aria-label={`Quản trị - gửi email tới ${adminEmail}`}
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80 print:text-black"
        >
          Quản trị
        </a>
      </p>
    </footer>
  );
}
