#include<bits/stdc++.h>
using namespace std;

#define MAX 100

int heap[MAX];
int heapSize = 0;

void heapifyDown(int i) {
    int smallest = i;
    int left = 2*i + 1;
    int right = 2*i + 2;

    if (left < heapSize && heap[left] < heap[smallest]){
        smallest = left;
    }
    if (right < heapSize && heap[right] < heap[smallest]){
        smallest = right;
    }
    if (smallest != i) {
        swap(heap[i], heap[smallest]);
        heapifyDown(smallest);
    }
}

void heapifyUp(int i) {
    while (i > 0 && heap[(i - 1) / 2] > heap[i]) {
        swap(heap[i], heap[(i - 1) / 2]);
        i = (i - 1) / 2;
    }
}

void insert(int val) {
    if (heapSize == MAX) {
        cout << "Overflow\n";
        return;
    }
    heap[heapSize++] = val;
    heapifyUp(heapSize - 1);
}

void deleteNode() {
    if (heapSize == 0) {
        cout << "No Element\n";
        return;
    }
    heap[0] = heap[heapSize - 1];
    heapSize--;
    heapifyDown(0);
}

int search(int val) {
    for (int i = 0; i < heapSize; i++) {
        if (heap[i] == val)
            return i;
    }
    return -1;
}

void deleteValue(int val) {
    int index = search(val);
    if (index == -1) {
        cout << "Element not found\n";
        return;
    }

    heap[index] = heap[heapSize - 1];
    heapSize--;

    heapifyDown(index);
    heapifyUp(index);
}

void printHeap() {
    for (int i = 0; i < heapSize; i++){
        cout << heap[i] << " ";
    }
    cout << endl;
}

int main() {
    insert(5);
    insert(2);
    insert(8);
    insert(1);
    insert(10);
    cout << "Heap: ";
    printHeap();
    cout << "Delete 2\n";
    deleteValue(2);
    printHeap();
    cout << "Delete min\n";
    deleteNode();
    printHeap();
    return 0;
}
