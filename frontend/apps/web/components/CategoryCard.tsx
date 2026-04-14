type CategoryCardProps = {
  name: string;
};

export default function CategoryCard({ name }: CategoryCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-100 p-4 text-center font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
      {name}
    </div>
  );
}
