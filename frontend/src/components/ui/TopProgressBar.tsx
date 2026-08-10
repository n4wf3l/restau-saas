/**
 * Thin animated progress bar pinned to the top of a container.
 * NProgress-style: eases toward 90%, snaps to 100% when done, then fades out.
 * Use for background fetches so the user knows something is happening without
 * the disruption of a full-page spinner.
 */
export function TopProgressBar({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 inset-x-0 z-[70] h-[2px] overflow-hidden transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`h-full bg-gradient-to-r from-cream-400 via-cream-500 to-coffee-500 origin-left ${
          visible ? 'animate-top-progress' : ''
        }`}
        style={{ width: '100%' }}
      />
    </div>
  );
}
