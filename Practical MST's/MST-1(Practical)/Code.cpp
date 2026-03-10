class Solution {
  public:
    vector<int> maxOfSubarrays(vector<int>& arr, int k) {
        vector<int> res;
        priority_queue<pair<int,int>> pq;
        for(int i = 0; i < arr.size(); i++) {
            pq.push({arr[i], i});
            while(pq.top().second <= i - k) {
                pq.pop();
            }
            if(i >= k - 1) {
                res.push_back(pq.top().first);
            }
        }
        return res;
    }
};