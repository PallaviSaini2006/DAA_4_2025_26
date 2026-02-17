class Solution {
  public:
    bool canPaint(vector<int>& arr, int k, long long maxTime) {
        int painters = 1;
        long long curr = 0;
        for (int i = 0; i < arr.size(); i++) {
            if (curr + arr[i] > maxTime) {
                painters++;
                curr = arr[i];
                if (painters > k) return false;
            } else {
                curr += arr[i];
            }
        }
        return true;
    }

    int minTime(vector<int>& arr, int k) {
        long long lo = *max_element(arr.begin(), arr.end());
        long long hi = 0;
        for (int x : arr) hi += x;

        long long ans = hi;
        while (lo <= hi) {
            long long mid = lo + (hi - lo) / 2;
            if (canPaint(arr, k, mid)) {
                ans = mid;
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        }
        return ans;
    }
};
