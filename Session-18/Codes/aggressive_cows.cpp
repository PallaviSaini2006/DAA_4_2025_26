class Solution {
  public:
    bool canPlace(vector<int> &stalls, int k, int dist) {
        int cnt = 1;
        int last = stalls[0];
        for (int i = 1; i < stalls.size(); i++) {
            if (stalls[i] - last >= dist) {
                cnt++;
                last = stalls[i];
            }
            if (cnt >= k) return true;
        }
        return false;
    }

    int aggressiveCows(vector<int> &stalls, int k) {
        sort(stalls.begin(), stalls.end());
        int lo = 1;
        int hi = stalls.back() - stalls[0];
        int res = 0;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (canPlace(stalls, k, mid)) {
                res = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return res;
    }
};
