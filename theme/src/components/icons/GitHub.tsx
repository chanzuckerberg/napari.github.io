import { IconProps } from './icons.type';

export function GitHub({ className, alt }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path
        d="M7 0.173252C3.1325 0.173252 0 3.3075 0 7.17325C0 10.2667 2.0055 12.8899 4.78625 13.8145C5.13625 13.8804 5.26458 13.664 5.26458 13.4779C5.26458 13.3117 5.25875 12.8713 5.25583 12.2879C3.30867 12.7103 2.898 11.3488 2.898 11.3488C2.5795 10.5408 2.11925 10.325 2.11925 10.325C1.48517 9.891 2.16825 9.89975 2.16825 9.89975C2.87117 9.94875 3.24042 10.6208 3.24042 10.6208C3.86458 11.6912 4.879 11.382 5.27917 11.2029C5.34217 10.7503 5.52242 10.4417 5.7225 10.2667C4.16792 10.0917 2.534 9.48967 2.534 6.8075C2.534 6.04334 2.80525 5.41917 3.25442 4.92917C3.17567 4.75242 2.93942 4.04075 3.31567 3.0765C3.31567 3.0765 3.90192 2.88867 5.24067 3.794C5.80067 3.63825 6.39567 3.56125 6.99067 3.55775C7.58567 3.56125 8.18067 3.63825 8.74067 3.794C10.0707 2.88867 10.6569 3.0765 10.6569 3.0765C11.0332 4.04075 10.7969 4.75242 10.7269 4.92917C11.1732 5.41917 11.4444 6.04334 11.4444 6.8075C11.4444 9.49667 9.80817 10.0888 8.25067 10.2608C8.49567 10.4708 8.72317 10.9002 8.72317 11.5558C8.72317 12.4927 8.71442 13.2452 8.71442 13.4727C8.71442 13.6564 8.83692 13.8752 9.19567 13.8052C11.9962 12.887 14 10.262 14 7.17325C14 3.3075 10.8657 0.173252 7 0.173252Z"
        fill="black"
      />
    </svg>
  );
}
