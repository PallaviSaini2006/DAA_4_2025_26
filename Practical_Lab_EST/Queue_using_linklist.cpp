#include <iostream>
using namespace std;
struct Node{
    int data;
    Node* next;
};
class Queue{
    private:
    Node* front;
    Node* rear;

    public:
    Queue(){
        front= rear= NULL;
    }

    void enqueue(int x){
        Node* temp= new Node();
        temp->data= x;
        temp->next= NULL;
        if (rear== NULL) {
            front= rear= temp;
            return;
        }
        rear->next= temp;
        rear= temp;
    }

    void dequeue() {
        if (front == NULL) {
            cout << "Queue Underflow\n";
            return;
        }
        Node* temp = front;
        front = front->next;
        if (front == NULL) {
            rear = NULL;
        }
        delete temp;
    }

    void display() {
        if (front == NULL) {
            cout << "Queue is empty\n";
            return;
        }

        Node* temp = front;
        while (temp != NULL) {
            cout << temp->data << " ";
            temp = temp->next;
        }
        cout << endl;
    }
};