class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        int low=1;
        int high=*max_element(piles.begin(),piles.end());
        while(low<high){
            int mid= (low+high)/2;
            int cnt=0;
            for (int i = 0; i < piles.size(); i++) {
                cnt += (piles[i] + mid - 1) / mid;
            }
            if (cnt > h) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low;
    }
};
