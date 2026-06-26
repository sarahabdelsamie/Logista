const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`border-4 border-[#1D4ED8] border-t-transparent rounded-full animate-spin ${sizes[size]} ${className}`} />
  );
};

export const FullPageSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#F0F2F7]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-[#64748B] font-medium">Loading...</p>
    </div>
  </div>
);

export default Spinner;
