/** Admin pages while they load: the heading and four tiles, in Soft Glass (AIIN-138). */
export default function AdminLoading() {
    return (
        <div aria-busy="true" className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-2">
                <span className="sg-skeleton h-11 w-56 rounded-2xl" />
                <span className="sg-skeleton h-6 w-80 max-w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <span key={i} className="sg-skeleton h-[104px] rounded-[24px]" />
                ))}
            </div>
            <span className="sg-skeleton h-80 rounded-[28px]" />
        </div>
    );
}
