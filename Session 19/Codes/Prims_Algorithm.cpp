#include <iostream>
using namespace std;

#define INF 999999

class PrimsAlgorithm {
private:
    int vertices;
    int** graph;
    int* visited;
    int* key;
    
public:
    PrimsAlgorithm(int v) {
        vertices = v;
        
        graph = new int*[v];
        for (int i = 0; i < v; i++) {
            graph[i] = new int[v];
            for (int j = 0; j < v; j++) {
                graph[i][j] = 0;
            }
        }
        
        visited = new int[v];
        key = new int[v];
        
        for (int i = 0; i < v; i++) {
            visited[i] = 0;
            key[i] = INF;
        }
    }
    
    ~PrimsAlgorithm() {
        for (int i = 0; i < vertices; i++) {
            delete[] graph[i];
        }
        delete[] graph;
        delete[] visited;
        delete[] key;
    }
    
    void addEdge(int u, int v, int weight) {
        graph[u][v] = weight;
        graph[v][u] = weight;
    }
    
    int findMinKey() {
        int min = INF;
        int minIndex = -1;
        
        for (int i = 0; i < vertices; i++) {
            if (!visited[i] && key[i] < min) {
                min = key[i];
                minIndex = i;
            }
        }
        
        return minIndex;
    }
    
    void findMST() {
        key[0] = 0;
        
        cout << "Minimum Spanning Tree (Prim's Algorithm):\n";
        cout << "Edge\t\tWeight\n";
        
        int totalWeight = 0;
        
        for (int count = 0; count < vertices - 1; count++) {
            int u = findMinKey();
            visited[u] = 1;
            
            for (int v = 0; v < vertices; v++) {
                if (graph[u][v] > 0 && !visited[v] && graph[u][v] < key[v]) {
                    key[v] = graph[u][v];
                    cout << u << " - " << v << "\t\t" << graph[u][v] << "\n";
                    totalWeight += graph[u][v];
                }
            }
        }
        
        cout << "\nTotal Weight of MST: " << totalWeight << "\n";
    }
};

int main() {
    PrimsAlgorithm prim(4);
    
    // Add edges
    prim.addEdge(0, 1, 2);
    prim.addEdge(0, 3, 6);
    prim.addEdge(1, 2, 3);
    prim.addEdge(1, 3, 8);
    prim.addEdge(2, 3, 1);
    
    prim.findMST();
    
    return 0;
}
