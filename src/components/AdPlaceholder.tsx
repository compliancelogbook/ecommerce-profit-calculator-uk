export default function AdPlaceholder({
  width = "w-full",
  height = "h-[90px]",
  text = "ADVERTISEMENT"
}: {
  width?: string;
  height?: string;
  text?: string;
}) {
  return (
    <div className={`my-6 flex items-center justify-center bg-[#0a0a0a] border border-dashed border-[#333] rounded-lg text-[#666] font-medium text-xs tracking-widest ${width} ${height}`}>
      {text}
    </div>
  );
}
