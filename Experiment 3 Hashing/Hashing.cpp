#include <iostream>
#include <string>
#include <unordered_map>

using namespace std;

int main() {
    string s;
    cin >> s;
    
    unordered_map<int, int> m;
    m[0] = -1;
    
    int x = 0;
    int ans = 0;
    int n = s.length();

    for(int i = 0; i < n; i++) {
        if(s[i] == 'P') {
            x++;
        } else {
            x--;
        }

        if(m.count(x)) {
            int len = i - m[x];
            if(len > ans) {
                ans = len;
            }
        } else {
            m[x] = i;
        }
    }
    
    cout << ans;
    return 0;
}