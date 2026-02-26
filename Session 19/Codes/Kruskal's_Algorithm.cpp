class Solution {
    int parent[1001], rnk[1001];
    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);
        return parent[x];
    }

    bool unite(int a, int b) {
        int rootA = find(a);
        int rootB = find(b);

        if (rootA == rootB) return false;

        if (rnk[rootA] < rnk[rootB])
            parent[rootA] = rootB;
        else if (rnk[rootA] > rnk[rootB])
            parent[rootB] = rootA;
        else {
            parent[rootB] = rootA;
            rnk[rootA]++;
        }
        return true;
    }

public:

    int spanningTree(int V, vector<vector<int>> adj[]) {
        vector<pair<int, pair<int, int>>> edges;

        for (int u = 0; u < V; u++) {
            for (auto &it : adj[u]) {
                int v = it[0];
                int wt = it[1];
                if (u < v)
                    edges.push_back({wt, {u, v}});
            }
        }
        sort(edges.begin(), edges.end());
        for (int i = 0; i < V; i++) {
            parent[i] = i;
            rnk[i] = 0;
        }

        int mstWeight = 0;
        int edgesUsed = 0;

        for (auto &e : edges) {
            int wt = e.first;
            int u = e.second.first;
            int v = e.second.second;

            if (unite(u, v)) {
                mstWeight += wt;
                edgesUsed++;

                if (edgesUsed == V - 1) break;
            }
        }
        return mstWeight;
    }
};