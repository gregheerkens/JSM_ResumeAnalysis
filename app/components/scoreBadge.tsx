const ScoreBadge = ({ score }: { score: number }) => {
  if (score > 70) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Strong</span>;
  }
  if (score > 49) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Needs Work</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">No Match/Redo</span>;
};

export default ScoreBadge;
