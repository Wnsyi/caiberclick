interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = '赛博华佗·精神理疗院',
  subtitle,
}: HeaderProps) {
  return (
    <header className="text-center py-6 px-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-amber-300 tracking-wider drop-shadow-lg">
        🏥 {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-purple-300/70 italic">{subtitle}</p>
      )}
    </header>
  );
}
