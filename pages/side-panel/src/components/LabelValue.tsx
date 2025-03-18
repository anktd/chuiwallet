interface LabelValueProps {
  label: string;
  value: string | React.ReactNode;
}

const LabelValue: React.FC<LabelValueProps> = ({ label, value }) => (
  <div className="flex items-center gap-8 text-sm font-bold leading-[20px]">
    <span className="text-sm text-white font-bold w-24">{label}</span>
    <span className="text-xs text-foreground font-bold w-[201px] text-ellipsis overflow-y-clip overflow-hidden">
      {value}
    </span>
  </div>
);

export default LabelValue;
